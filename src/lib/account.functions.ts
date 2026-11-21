import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canDeleteAccount, isDeletionConfirmed } from "@/lib/account-deletion-rules";

type AuthedContext = { userId: string };

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ confirmation: z.string().max(20) }).parse(input))
  .handler(async ({ context, data }) => {
    const { userId } = context as AuthedContext;
    if (!isDeletionConfirmed(data.confirmation)) {
      return { ok: false as const, reason: "Digite EXCLUIR para confirmar." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const orders = await supabaseAdmin.from("orders").select("id, status").eq("user_id", userId);
    if (orders.error) throw new Error("Não foi possível verificar seus pedidos.");
    if (!canDeleteAccount(orders.data.map((o) => o.status))) {
      return {
        ok: false as const,
        reason: "Você tem um pedido em andamento. A conta pode ser excluída depois que ele for entregue.",
      };
    }

    // Unpaid orders still hold reserved stock: release them first.
    for (const order of orders.data.filter((o) => o.status === "awaiting_payment")) {
      await supabaseAdmin.rpc("release_order_reservation", { _order_id: order.id });
    }

    const anonymized = await supabaseAdmin
      .from("orders")
      .update({ customer_name: "Conta excluída", customer_email: "excluido@anonimo.invalid", customer_phone: null })
      .eq("user_id", userId);
    if (anonymized.error) throw new Error("Não foi possível excluir a conta.");

    await supabaseAdmin.from("addresses").delete().eq("user_id", userId);
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const removed = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (removed.error) throw new Error("Não foi possível excluir a conta.");
    const address = authUser?.user?.email;
    if (address) {
      const { sendEmail } = await import("@/lib/email/send.server");
      const { accountDeletedEmail } = await import("@/lib/email/templates");
      const name = String(authUser.user?.user_metadata?.["full_name"] ?? authUser.user?.user_metadata?.["name"] ?? "");
      await sendEmail(address, accountDeletedEmail(name), `nero-deleted-${userId}`, "suporte");
    }
    return { ok: true as const };
  });

/** Envia o e-mail de boas-vindas uma única vez por conta (marca na conta do usuário). */
export const sendWelcomeEmailOnce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as AuthedContext;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    const user = data?.user;
    if (!user?.email || user.user_metadata?.["welcome_email_sent_at"]) return { sent: false };
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { ...user.user_metadata, welcome_email_sent_at: new Date().toISOString() },
    });
    const { sendEmail } = await import("@/lib/email/send.server");
    const { welcomeEmail } = await import("@/lib/email/templates");
    const name = String(user.user_metadata?.["full_name"] ?? user.user_metadata?.["name"] ?? "");
    const sent = await sendEmail(user.email, welcomeEmail(name), `nero-welcome-${userId}`, "suporte");
    return { sent };
  });

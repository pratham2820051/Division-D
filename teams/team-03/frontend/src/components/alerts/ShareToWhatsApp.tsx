"use client";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Toast, useToast } from "@/components/ui/toast";
import {
  resolveVetWhatsAppPhone,
  shareAlertOnWhatsApp,
} from "@/lib/whatsapp-share";

interface ShareToWhatsAppProps {
  message: string;
  phone?: string | null;
  className?: string;
}

export function ShareToWhatsApp({ message, phone, className }: ShareToWhatsAppProps) {
  const toast = useToast();
  const vetPhone = resolveVetWhatsAppPhone(phone);

  const handleShare = () => {
    shareAlertOnWhatsApp(message, vetPhone || null);
    toast.show("Opening WhatsApp...");
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleShare}
        className={className ?? "gap-1.5 bg-[#25D366] text-white hover:bg-[#20BD5A]"}
      >
        <WhatsAppIcon />
        Share on WhatsApp
      </Button>
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </>
  );
}

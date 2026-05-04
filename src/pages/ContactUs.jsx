import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Send, Sparkles, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { buildWhatsAppLink, getAdminWhatsAppNumber } from '../utils/whatsapp';
import { useLanguage } from '../context/LanguageContext';

const ContactUs = () => {
  const { dir } = useLanguage();
  const { i18n } = useTranslation();
  const isArabic = String(i18n.resolvedLanguage || i18n.language || dir || 'ar').toLowerCase().startsWith('ar');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [messageError, setMessageError] = useState('');

  const ui = useMemo(() => {
    if (isArabic) {
      return {
        eyebrow: 'اتصل بنا',
        title: 'اكتب رسالتك وسنفتح واتساب مباشرة',
        nameLabel: 'الاسم',
        namePlaceholder: 'اكتب اسمك هنا',
        messageLabel: 'الرسالة',
        messagePlaceholder: 'اكتب تفاصيل طلبك أو استفسارك',
        submit: 'إرسال',
        helper: 'سيتم فتح واتساب تلقائيًا مع الرسالة التي كتبتها.',
        previewTitle: 'معاينة الرسالة',
        previewHint: 'سيظهر النص بهذا الشكل داخل واتساب.',
        nameRequired: 'الاسم مطلوب.',
        messageRequired: 'الرسالة مطلوبة.',
        success: 'تم تجهيز الرسالة وفتح واتساب.',
      };
    }

    return {
      eyebrow: 'Contact us',
      title: 'Write your message and open WhatsApp instantly',
      description: 'A simple, fast form that sends your name and message to WhatsApp in a clear ready-to-send format.',
      nameLabel: 'Name',
      namePlaceholder: 'Enter your name',
      messageLabel: 'Message',
      messagePlaceholder: 'Write your request or question',
      submit: 'Send',
      helper: 'WhatsApp will open automatically with your message filled in.',
      previewTitle: 'Message preview',
      previewHint: 'This is how the text will appear inside WhatsApp.',
      nameRequired: 'Name is required.',
      messageRequired: 'Message is required.',
      success: 'Your message is ready and WhatsApp has been opened.',
    };
  }, [isArabic]);

  const previewText = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName && !trimmedMessage) {
      return isArabic
        ? 'الاسم: -\nالرسالة: -'
        : 'Name: -\nMessage: -';
    }

    return isArabic
      ? `الاسم: ${trimmedName || '-'}\nالرسالة: ${trimmedMessage || '-'}`
      : `Name: ${trimmedName || '-'}\nMessage: ${trimmedMessage || '-'}`;
  }, [isArabic, message, name]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    const nextNameError = trimmedName ? '' : ui.nameRequired;
    const nextMessageError = trimmedMessage ? '' : ui.messageRequired;

    setNameError(nextNameError);
    setMessageError(nextMessageError);

    if (nextNameError || nextMessageError) {
      return;
    }

    const formattedMessage = isArabic
      ? `الاسم: ${trimmedName}\nالرسالة: ${trimmedMessage}`
      : `Name: ${trimmedName}\nMessage: ${trimmedMessage}`;

    const href = buildWhatsAppLink({
      number: getAdminWhatsAppNumber(),
      message: formattedMessage,
    });

    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.94),rgba(241,245,249,0.82))] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))]" />
      <div className="pointer-events-none absolute left-10 top-16 h-36 w-36 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.1)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-12 h-44 w-44 rounded-full bg-[color:rgb(var(--color-success-rgb)/0.1)] blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6 order-2 lg:order-1"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[color:rgb(var(--color-card-rgb)/0.72)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-subtle)] backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            <span>{ui.eyebrow}</span>
            <span className="rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.12)] px-2 py-0.5 text-[10px] text-[var(--color-primary-hover)]">wa.me</span>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-3xl font-black leading-tight tracking-tight text-[var(--color-text)] sm:text-5xl">
              {ui.title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              {ui.description}
            </p>
          </div>

          <Card variant="flat" className="border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.88)] p-5 shadow-[var(--shadow-medium)] backdrop-blur-xl sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(16,185,129,0.16))] text-[var(--color-primary)]">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-[var(--color-text)]">{ui.previewTitle}</h2>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{ui.previewHint}</p>
                <pre className="whitespace-pre-wrap rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.88)] p-4 text-sm leading-7 text-[var(--color-text)] shadow-[var(--shadow-subtle)]">
                  {previewText}
                </pre>
              </div>
            </div>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="order-1 lg:order-2"
        >
          <Card variant="premium" className="relative overflow-hidden border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.92)] p-5 shadow-[var(--shadow-medium)] sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-primary),rgba(59,130,246,0.62),rgba(16,185,129,0.82))]" />
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">{ui.eyebrow}</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">{ui.helper}</p>
                </div>
              </div>

              <Input
                label={ui.nameLabel}
                placeholder={ui.namePlaceholder}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError('');
                }}
                error={nameError}
                autoComplete="name"
              />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)] sm:text-sm">
                  {ui.messageLabel}
                </label>
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (messageError) setMessageError('');
                  }}
                  placeholder={ui.messagePlaceholder}
                  rows={6}
                  className="flex w-full resize-none rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.92)] px-3.5 py-3 text-[13px] text-[var(--color-text)] shadow-[var(--shadow-subtle)] transition-all duration-200 hover:border-[color:rgb(var(--color-primary-rgb)/0.22)] focus:border-[color:rgb(var(--color-primary-rgb)/0.45)] focus:bg-[color:rgb(var(--color-surface-rgb)/0.98)] focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.12)] focus:shadow-[var(--shadow-subtle),var(--shadow-focus)] sm:text-sm"
                />
                {messageError ? (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{messageError}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                <Send className="h-4 w-4" />
                {ui.submit}
              </Button>

              <div className="flex items-start gap-2 rounded-2xl border border-[color:rgb(var(--color-success-rgb)/0.18)] bg-[color:rgb(var(--color-success-rgb)/0.08)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                <span>{ui.success}</span>
              </div>
            </form>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

export default ContactUs;
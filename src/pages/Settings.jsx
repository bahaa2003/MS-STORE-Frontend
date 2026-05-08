import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Coins, CreditCard, Globe, KeyRound, LayoutDashboard, LogOut, Palette, Shield, User2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingsSection from '../components/settings/SettingsSection';
import SettingsItem from '../components/settings/SettingsItem';
import ConfirmDialog from '../components/account/ConfirmDialog';
import Button, { cn } from '../components/ui/Button';
import Switch from '../components/ui/Switch';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import useAuthStore from '../store/useAuthStore';

const SETTINGS_PREFS_KEY = 'ibra-settings-prefs-v1';

const Settings = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [notifications, setNotifications] = useState({
    orders: true,
    balance: true,
    offers: false
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // No localStorage persistence: keep settings in-memory only for this session.

  const isEnglish = language === 'en';
  const text = useMemo(
    () =>
      isEnglish
        ? {
            title: isAdmin ? 'Admin Settings' : 'Settings',
            subtitle: isAdmin ? 'Manage dashboard preferences and admin shortcuts' : 'Control your preferences and account configuration',
            accountSection: isAdmin ? 'Admin Tools' : 'Account',
            accountSectionDescription: isAdmin ? 'Quick links for the main admin dashboard areas' : 'Manage your personal profile and account details',
            myAccount: 'My Account',
            myAccountDescription: 'View and edit your account data',
            dashboardOverview: 'Dashboard Home',
            dashboardOverviewDescription: 'Return to the main admin dashboard',
            usersManager: 'Users Management',
            usersManagerDescription: 'Manage customers, balances, and account actions',
            paymentsManager: 'Payment Methods',
            paymentsManagerDescription: 'Manage grouped payment methods and transfer options',
            topupsManager: 'Payment Requests',
            topupsManagerDescription: 'Review transfer confirmations and top-up operations',
            currenciesManager: 'Currencies',
            currenciesManagerDescription: 'Manage enabled currencies and defaults',
            languageSection: 'Language',
            languageSectionDescription: 'Choose your preferred application language',
            appearanceSection: 'Appearance',
            appearanceSectionDescription: 'Customize your app look and visual theme',
            darkMode: 'Dark mode',
            darkModeDescription: 'Use premium dark look across the app',
            notificationsSection: 'Notifications',
            notificationsSectionDescription: 'Select which alerts you would like to receive',
            notificationsOrders: 'Orders notifications',
            notificationsBalance: 'Balance notifications',
            notificationsOffers: 'Offers notifications',
            securitySection: 'Security',
            securitySectionDescription: 'Quick actions for password and security controls',
            changePassword: 'Change password',
            changePasswordDescription: 'Open account security panel to update password',
            twoFactor: 'Two-factor authentication',
            twoFactorDescription: 'Enable or disable email OTP protection',
            logoutAllDevices: 'Sign out from all devices',
            logoutAllDevicesDescription: 'Placeholder action until backend session APIs are connected',
            logoutAccount: 'Log out',
            logoutAccountDescription: 'Securely sign out from this account and return to the login screen',
            logoutAccountAction: 'Sign out now',
            logoutConfirmTitle: 'Logout',
            logoutConfirmDescription: 'Do you want to logout?',
            confirm: 'Confirm',
            cancel: 'Cancel',
            open: 'Open',
            active: 'Active',
            simulatedActionDone: 'Placeholder action executed. Connect backend endpoint later.',
            arabic: 'Arabic',
            english: 'English'
          }
        : {
            title: isAdmin ? 'إعدادات الأدمن' : 'الإعدادات',
            subtitle: isAdmin ? 'تحكم في تفضيلات لوحة الإدارة والاختصارات السريعة' : 'تحكم في تفضيلاتك وإعدادات حسابك',
            accountSection: isAdmin ? 'أدوات الإدارة' : 'الحساب',
            accountSectionDescription: isAdmin ? 'اختصارات سريعة لأهم أقسام لوحة الأدمن' : 'إدارة بياناتك الشخصية وإعدادات الحساب',
            myAccount: 'حسابي',
            myAccountDescription: 'عرض وتعديل بيانات حسابك',
            dashboardOverview: 'الرئيسية',
            dashboardOverviewDescription: 'الرجوع إلى الصفحة الرئيسية للوحة الأدمن',
            usersManager: 'إدارة المستخدمين',
            usersManagerDescription: 'إدارة العملاء والأرصدة وإجراءات الحساب',
            paymentsManager: 'طرق الدفع',
            paymentsManagerDescription: 'إدارة مجموعات الدفع ووسائل التحويل',
            topupsManager: 'طلبات الدفع',
            topupsManagerDescription: 'مراجعة تأكيدات التحويل وطلبات الشحن',
            currenciesManager: 'العملات',
            currenciesManagerDescription: 'إدارة العملات المفعلة والافتراضية',
            languageSection: 'اللغة',
            languageSectionDescription: 'اختر لغة التطبيق المفضلة لديك',
            appearanceSection: 'المظهر',
            appearanceSectionDescription: 'تحكم في شكل التطبيق وتجربة العرض',
            darkMode: 'الوضع الداكن',
            darkModeDescription: 'استخدام الواجهة الداكنة داخل التطبيق',
            notificationsSection: 'الإشعارات',
            notificationsSectionDescription: 'حدد الإشعارات التي تريد استقبالها',
            notificationsOrders: 'إشعارات الطلبات',
            notificationsBalance: 'إشعارات الرصيد',
            notificationsOffers: 'إشعارات العروض',
            securitySection: 'الأمان',
            securitySectionDescription: 'اختصارات لتغيير كلمة المرور وضبط الحماية',
            changePassword: 'تغيير كلمة المرور',
            changePasswordDescription: 'فتح قسم الأمان في صفحة حسابي لتحديث كلمة المرور',
            twoFactor: 'المصادقة الثنائية',
            twoFactorDescription: 'تفعيل أو تعطيل التحقق برمز البريد الإلكتروني',
            logoutAllDevices: 'تسجيل الخروج من كل الأجهزة',
            logoutAllDevicesDescription: 'إجراء تجريبي حتى يتم ربط واجهات الجلسات في الـ Backend',
            logoutAccount: 'تسجيل الخروج',
            logoutAccountDescription: 'الخروج الآمن من هذا الحساب والرجوع إلى صفحة تسجيل الدخول',
            logoutAccountAction: 'تسجيل الخروج الآن',
            logoutConfirmTitle: 'تسجيل الخروج',
            logoutConfirmDescription: 'هل تريد تسجيل الخروج؟',
            confirm: 'موافق',
            cancel: 'إلغاء',
            open: 'فتح',
            active: 'مفعل',
            simulatedActionDone: 'تم تنفيذ إجراء تجريبي. اربطه لاحقًا بواجهة الخلفية.',
            arabic: 'العربية',
            english: 'English'
          },
    [isAdmin, isEnglish]
  );

  const handlePlaceholderSecurityAction = () => {
    addToast(text.simulatedActionDone, 'info');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/auth');
  };

  const openFromSettings = (to) => navigate(to, { state: { fromSettings: true } });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.9)] p-5 shadow-[var(--shadow-subtle)] backdrop-blur-md"
      >
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{text.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text.subtitle}</p>
      </motion.header>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <SettingsSection icon={isAdmin ? LayoutDashboard : User2} title={text.accountSection} description={text.accountSectionDescription}>
          {isAdmin && (
            <>
              <SettingsItem
                icon={LayoutDashboard}
                title={text.dashboardOverview}
                description={text.dashboardOverviewDescription}
                action={text.open}
                onClick={() => openFromSettings('/dashboard')}
              />
              <SettingsItem
                icon={Users}
                title={text.usersManager}
                description={text.usersManagerDescription}
                action={text.open}
                onClick={() => openFromSettings('/admin/users')}
              />
              <SettingsItem
                icon={CreditCard}
                title={text.paymentsManager}
                description={text.paymentsManagerDescription}
                action={text.open}
                onClick={() => openFromSettings('/admin/payment-methods')}
              />
              <SettingsItem
                icon={Bell}
                title={text.topupsManager}
                description={text.topupsManagerDescription}
                action={text.open}
                onClick={() => openFromSettings('/admin/payments')}
              />
              <SettingsItem
                icon={Coins}
                title={text.currenciesManager}
                description={text.currenciesManagerDescription}
                action={text.open}
                onClick={() => openFromSettings('/admin/currencies')}
              />
            </>
          )}
          <SettingsItem
            icon={User2}
            title={text.myAccount}
            description={text.myAccountDescription}
            action={text.open}
            onClick={() => openFromSettings('/account')}
          />
        </SettingsSection>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <SettingsSection icon={Globe} title={text.languageSection} description={text.languageSectionDescription}>
          <div className="overflow-hidden rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-elevated-rgb)/0.7)] p-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={language === 'ar' ? 'primary' : 'ghost'}
                className={cn('w-full motion-safe:hover:translate-y-0 active:scale-100', language !== 'ar' && 'text-[var(--color-text-secondary)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]')}
                onClick={() => setLanguage('ar')}
              >
                {text.arabic}
              </Button>
              <Button
                type="button"
                variant={language === 'en' ? 'primary' : 'ghost'}
                className={cn('w-full motion-safe:hover:translate-y-0 active:scale-100', language !== 'en' && 'text-[var(--color-text-secondary)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]')}
                onClick={() => setLanguage('en')}
              >
                {text.english}
              </Button>
            </div>
          </div>
        </SettingsSection>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <SettingsSection icon={Palette} title={text.appearanceSection} description={text.appearanceSectionDescription}>
          <div className="flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-elevated-rgb)/0.7)] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">{text.darkMode}</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{text.darkModeDescription}</p>
            </div>
            <Switch checked={isDark} onChange={toggleTheme} />
          </div>
        </SettingsSection>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <SettingsSection icon={Bell} title={text.notificationsSection} description={text.notificationsSectionDescription}>
          {[
            { key: 'orders', label: text.notificationsOrders },
            { key: 'balance', label: text.notificationsBalance },
            { key: 'offers', label: text.notificationsOffers }
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-elevated-rgb)/0.7)] px-4 py-3"
            >
              <p className="min-w-0 text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
              <Switch
                checked={Boolean(notifications[item.key])}
                onChange={(checked) =>
                  setNotifications((prev) => ({
                    ...prev,
                    [item.key]: checked
                  }))
                }
              />
            </div>
          ))}
        </SettingsSection>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <SettingsSection icon={Shield} title={text.securitySection} description={text.securitySectionDescription}>
          <SettingsItem
            icon={KeyRound}
            title={text.changePassword}
            description={text.changePasswordDescription}
            action={text.open}
            onClick={() => openFromSettings('/account#password')}
          />
          <SettingsItem
            icon={Shield}
            title={text.twoFactor}
            description={text.twoFactorDescription}
            action={text.open}
            onClick={() => openFromSettings('/account-security')}
          />
          <SettingsItem
            icon={LogOut}
            title={text.logoutAllDevices}
            description={text.logoutAllDevicesDescription}
            action={text.active}
            destructive
            onClick={handlePlaceholderSecurityAction}
          />
        </SettingsSection>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="group relative w-full overflow-hidden rounded-2xl border border-rose-300/55 bg-gradient-to-br from-rose-500/14 via-[color:rgb(var(--color-card-rgb)/0.94)] to-orange-400/10 px-4 py-4 text-right shadow-[var(--shadow-subtle)] transition-all hover:-translate-y-0.5 hover:border-rose-400/70 hover:shadow-[var(--shadow-lg)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.18),transparent_42%)] opacity-80" />
          <div className="relative flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-300/45 bg-rose-500/14 text-rose-600 dark:text-rose-200">
              <LogOut className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-100">{text.logoutAccount}</p>
              <p className="mt-1 text-xs text-rose-600/90 dark:text-rose-100/75">{text.logoutAccountDescription}</p>
            </div>

            <span className="shrink-0 rounded-full border border-rose-300/45 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-700 transition-colors group-hover:bg-rose-500/16 dark:text-rose-100">
              {text.logoutAccountAction}
            </span>
          </div>
        </button>
      </motion.section>

      <ConfirmDialog
        open={showLogoutConfirm}
        title={text.logoutConfirmTitle}
        description={text.logoutConfirmDescription}
        confirmLabel={text.confirm}
        cancelLabel={text.cancel}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default Settings;

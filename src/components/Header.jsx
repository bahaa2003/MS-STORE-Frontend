import React from 'react';
import { motion } from 'framer-motion';
import { Menu, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './ui/LanguageSwitcher';

const Header = ({ user, onMenuClick, showUserInfo = true }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 app-header border-b border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-2 sm:gap-3">
        {isRTL ? (
          <>
            <div className="text-lg font-bold text-white sm:text-xl">MS</div>
            {showUserInfo && (
              <motion.div
                className="flex items-center gap-2 sm:gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 p-0.5 sm:h-10 sm:w-10">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-900">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-semibold text-white sm:text-sm">{user?.name || t('common.user')}</h3>
                  <p className="text-[10px] text-gray-400 sm:text-xs">
                    {user?.role ? t(`roles.${user.role}`, { defaultValue: user.role }) : t('common.customer')}
                  </p>
                </div>
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher variant="glass" />
              <motion.button
                onClick={onMenuClick}
                className="rounded-full bg-white/10 p-2 text-white transition-colors duration-200 hover:bg-white/20"
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={20} className="sm:h-6 sm:w-6" />
              </motion.button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher variant="glass" />
              <motion.button
                onClick={onMenuClick}
                className="rounded-full bg-white/10 p-2 text-white transition-colors duration-200 hover:bg-white/20"
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={20} className="sm:h-6 sm:w-6" />
              </motion.button>
            </div>
            {showUserInfo && (
              <motion.div
                className="flex items-center gap-2 sm:gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 p-0.5 sm:h-10 sm:w-10">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-900">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white sm:text-sm">{user?.name || t('common.user')}</h3>
                  <p className="text-[10px] text-gray-400 sm:text-xs">
                    {user?.role ? t(`roles.${user.role}`, { defaultValue: user.role }) : t('common.customer')}
                  </p>
                </div>
              </motion.div>
            )}
            <div className="text-lg font-bold text-white sm:text-xl">MS</div>
          </>
        )}
      </div>
    </motion.header>
  );
};

export default Header;

// Mock data for wallet and payment features

export const mockWalletStats = {
  totalDeposits: '5,250 EGP',
  totalSpent: '2,750 EGP',
  netBalance: '2,500 EGP',
  totalTransactions: 24
};

export const mockTransactions = [
  {
    id: '1',
    type: 'deposit',
    description: 'إيداع من خلال فودافون كاش',
    amount: 500,
    currency: 'EGP',
    status: 'completed',
    date: '2024-01-15T10:30:00Z',
    reference: 'TXN-001'
  },
  {
    id: '2',
    type: 'purchase',
    description: 'شراء PUBG Mobile UC',
    amount: -325,
    currency: 'EGP',
    status: 'completed',
    date: '2024-01-14T15:45:00Z',
    reference: 'ORD-001'
  },
  {
    id: '3',
    type: 'transfer',
    description: 'تحويل إلى صديق',
    amount: -200,
    currency: 'EGP',
    status: 'completed',
    date: '2024-01-13T09:20:00Z',
    reference: 'TRF-001'
  },
  {
    id: '4',
    type: 'deposit',
    description: 'إيداع من خلال البنك',
    amount: 1000,
    currency: 'EGP',
    status: 'pending',
    date: '2024-01-12T14:10:00Z',
    reference: 'TXN-002'
  }
];

export const mockPaymentMethods = [
  {
    id: 'vodafone',
    name: 'فودافون كاش',
    description: 'ادفع من خلال فودافون كاش',
    icon: '📱',
    currency: 'EGP',
    accountNumber: '01012345678',
    accountName: 'MS STORE',
    bankName: '',
    instructions: 'أرسل المبلغ المطلوب إلى الرقم أعلاه مع كتابة "شحن محفظة" في رسالة التحويل',
    status: 'active'
  },
  {
    id: 'etisalat',
    name: 'اتصالات كاش',
    description: 'ادفع من خلال اتصالات كاش',
    icon: '📱',
    currency: 'EGP',
    accountNumber: '01112345678',
    accountName: 'MS STORE',
    bankName: '',
    instructions: 'أرسل المبلغ المطلوب إلى الرقم أعلاه مع كتابة "شحن محفظة" في رسالة التحويل',
    status: 'active'
  },
  {
    id: 'orange',
    name: 'أورانج كاش',
    description: 'ادفع من خلال أورانج كاش',
    icon: '📱',
    currency: 'EGP',
    accountNumber: '01212345678',
    accountName: 'MS STORE',
    bankName: '',
    instructions: 'أرسل المبلغ المطلوب إلى الرقم أعلاه مع كتابة "شحن محفظة" في رسالة التحويل',
    status: 'active'
  },
  {
    id: 'bank',
    name: 'تحويل بنكي',
    description: 'ادفع من خلال التحويل البنكي',
    icon: '🏦',
    currency: 'EGP',
    accountNumber: '123456789012345',
    accountName: 'MS STORE Ltd',
    bankName: 'البنك الأهلي المصري',
    instructions: 'قم بالتحويل البنكي إلى الحساب أعلاه مع كتابة "شحن محفظة" في سبب التحويل',
    status: 'active'
  },
  {
    id: 'western',
    name: 'ويسترن يونيون',
    description: 'ادفع من خلال ويسترن يونيون',
    icon: '💰',
    currency: 'EGP',
    accountNumber: 'WU123456789',
    accountName: 'MS STORE',
    bankName: '',
    instructions: 'قم بإرسال المبلغ عبر ويسترن يونيون إلى الاسم أعلاه',
    status: 'active'
  }
];

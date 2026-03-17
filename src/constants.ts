export const GCC_COUNTRIES = {
  SA: { 
    name: { EN: 'Saudi Arabia', AR: 'السعودية' }, 
    currency: { EN: 'SAR', AR: 'ر.س' }, 
    paymentMethods: { EN: ['Mada', 'STC Pay', 'urpay', 'Al Rajhi Bank', 'SNB', 'Visa/Mastercard'], AR: ['مدى', 'إس تي سي باي', 'يورباي', 'مصرف الراجحي', 'البنك الأهلي السعودي', 'فيزا/ماستركارد'] },
    methodsDetails: [
      { id: 'mada', name: { EN: 'Mada', AR: 'مدى' }, type: 'card' },
      { id: 'stcpay', name: { EN: 'STC Pay', AR: 'إس تي سي باي' }, type: 'wallet' },
      { id: 'urpay', name: { EN: 'urpay', AR: 'يورباي' }, type: 'wallet' },
      { id: 'alrajhi', name: { EN: 'Al Rajhi Bank', AR: 'مصرف الراجحي' }, type: 'bank' },
      { id: 'snb', name: { EN: 'SNB', AR: 'البنك الأهلي السعودي' }, type: 'bank' },
      { id: 'visa_mc', name: { EN: 'Visa/Mastercard', AR: 'فيزا/ماستركارد' }, type: 'card' }
    ]
  },
  AE: { 
    name: { EN: 'UAE', AR: 'الإمارات' }, 
    currency: { EN: 'AED', AR: 'د.إ' }, 
    paymentMethods: { EN: ['Apple Pay', 'Payit', 'Emirates NBD', 'FAB', 'Visa/Mastercard'], AR: ['Apple Pay', 'Payit', 'بنك الإمارات دبي الوطني', 'بنك أبوظبي الأول', 'فيزا/ماستركارد'] },
    methodsDetails: [
      { id: 'applepay', name: { EN: 'Apple Pay', AR: 'Apple Pay' }, type: 'wallet' },
      { id: 'payit', name: { EN: 'Payit', AR: 'Payit' }, type: 'wallet' },
      { id: 'enbd', name: { EN: 'Emirates NBD', AR: 'بنك الإمارات دبي الوطني' }, type: 'bank' },
      { id: 'fab', name: { EN: 'FAB', AR: 'بنك أبوظبي الأول' }, type: 'bank' },
      { id: 'visa_mc', name: { EN: 'Visa/Mastercard', AR: 'فيزا/ماستركارد' }, type: 'card' }
    ]
  },
  QA: { 
    name: { EN: 'Qatar', AR: 'قطر' }, 
    currency: { EN: 'QAR', AR: 'ر.ق' }, 
    paymentMethods: { EN: ['NAPS', 'Apple Pay', 'Google Pay', 'QNB', 'Visa/Mastercard'], AR: ['NAPS', 'Apple Pay', 'Google Pay', 'بنك قطر الوطني', 'فيزا/ماستركارد'] },
    methodsDetails: [
      { id: 'naps', name: { EN: 'NAPS', AR: 'NAPS' }, type: 'card' },
      { id: 'applepay', name: { EN: 'Apple Pay', AR: 'Apple Pay' }, type: 'wallet' },
      { id: 'gpay', name: { EN: 'Google Pay', AR: 'Google Pay' }, type: 'wallet' },
      { id: 'qnb', name: { EN: 'QNB', AR: 'بنك قطر الوطني' }, type: 'bank' },
      { id: 'visa_mc', name: { EN: 'Visa/Mastercard', AR: 'فيزا/ماستركارد' }, type: 'card' }
    ]
  },
  BH: { 
    name: { EN: 'Bahrain', AR: 'البحرين' }, 
    currency: { EN: 'BHD', AR: 'د.ب' }, 
    paymentMethods: { EN: ['BenefitPay', 'Benefit', 'BBK', 'NBB', 'Visa/Mastercard'], AR: ['بنفت باي', 'بنفت', 'بنك البحرين والكويت', 'بنك البحرين الوطني', 'فيزا/ماستركارد'] },
    methodsDetails: [
      { id: 'benefitpay', name: { EN: 'BenefitPay', AR: 'بنفت باي' }, type: 'wallet' },
      { id: 'benefit', name: { EN: 'Benefit', AR: 'بنفت' }, type: 'card' },
      { id: 'bbk', name: { EN: 'BBK', AR: 'بنك البحرين والكويت' }, type: 'bank' },
      { id: 'nbb', name: { EN: 'NBB', AR: 'بنك البحرين الوطني' }, type: 'bank' },
      { id: 'visa_mc', name: { EN: 'Visa/Mastercard', AR: 'فيزا/ماستركارد' }, type: 'card' }
    ]
  },
  KW: { 
    name: { EN: 'Kuwait', AR: 'الكويت' }, 
    currency: { EN: 'KWD', AR: 'د.ك' }, 
    paymentMethods: { EN: ['K-Net', 'Apple Pay', 'NBK', 'KFH', 'Visa/Mastercard'], AR: ['كي نت', 'Apple Pay', 'بنك الكويت الوطني', 'بيت التمويل الكويتي', 'فيزا/ماستركارد'] },
    methodsDetails: [
      { id: 'knet', name: { EN: 'K-Net', AR: 'كي نت' }, type: 'card' },
      { id: 'applepay', name: { EN: 'Apple Pay', AR: 'Apple Pay' }, type: 'wallet' },
      { id: 'nbk', name: { EN: 'NBK', AR: 'بنك الكويت الوطني' }, type: 'bank' },
      { id: 'kfh', name: { EN: 'KFH', AR: 'بيت التمويل الكويتي' }, type: 'bank' },
      { id: 'visa_mc', name: { EN: 'Visa/Mastercard', AR: 'فيزا/ماستركارد' }, type: 'card' }
    ]
  },
  OM: { 
    name: { EN: 'Oman', AR: 'عُمان' }, 
    currency: { EN: 'OMR', AR: 'ر.ع.' }, 
    paymentMethods: { EN: ['OmanNet', 'Thawani Pay', 'Bank Muscat', 'NBO', 'Visa/Mastercard'], AR: ['عمان نت', 'ثواني باي', 'بنك مسقط', 'البنك الوطني العماني', 'فيزا/ماستركارد'] },
    methodsDetails: [
      { id: 'omannet', name: { EN: 'OmanNet', AR: 'عمان نت' }, type: 'card' },
      { id: 'thawani', name: { EN: 'Thawani Pay', AR: 'ثواني باي' }, type: 'wallet' },
      { id: 'bankmuscat', name: { EN: 'Bank Muscat', AR: 'بنك مسقط' }, type: 'bank' },
      { id: 'nbo', name: { EN: 'NBO', AR: 'البنك الوطني العماني' }, type: 'bank' },
      { id: 'visa_mc', name: { EN: 'Visa/Mastercard', AR: 'فيزا/ماستركارد' }, type: 'card' }
    ]
  },
};

export const LANGUAGES = {
  EN: { name: 'English', dir: 'ltr' },
  AR: { name: 'العربية', dir: 'rtl' },
};

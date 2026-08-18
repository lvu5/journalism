export type Locale = 'vi' | 'en'

export const localeCookieName = 'journalism-locale'

export const localeTags: Record<Locale, string> = {
  vi: 'vi-VN',
  en: 'en-US',
}

export const commonCopy = {
  vi: {
    navigation: 'Điều hướng chính',
    home: 'Trang chủ',
    recent: 'Mới nhất',
    cases: 'Hồ sơ',
    byYear: 'Theo năm',
    guides: 'Hướng dẫn',
    submit: 'Gửi bài',
    tagline: 'Báo chí điều tra dựa trên dữ kiện',
    skip: 'Bỏ qua đến nội dung',
    footerMission: 'Ghi nhận điều đã biết, chỉ rõ điều chưa biết và để bằng chứng dẫn đường.',
    authorArea: 'Khu vực tác giả',
    language: 'Ngôn ngữ',
    account: 'Tài khoản',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
  },
  en: {
    navigation: 'Main navigation',
    home: 'Home',
    recent: 'Recent',
    cases: 'Cases',
    byYear: 'By year',
    guides: 'Guides',
    submit: 'Submit',
    tagline: 'Evidence-led investigative journalism',
    skip: 'Skip to content',
    footerMission: 'Record what is known, state what is not, and let the evidence lead.',
    authorArea: 'Author area',
    language: 'Language',
    account: 'Account',
    login: 'Log in',
    register: 'Register',
    logout: 'Log out',
  },
} as const

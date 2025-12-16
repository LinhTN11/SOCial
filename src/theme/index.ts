export const colors = {
    primary: '#0095F6', // Instagram Blue
    secondary: '#E1306C', // Instagram Gradient Pinkish
    background: '#FFFFFF',
    text: '#262626',
    textSecondary: '#8E8E8E',
    border: '#DBDBDB',
    error: '#ED4956',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#FAFAFA',
    lightGray: '#EFEFEF',
};

export const spacing = {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
};

export const typography = {
    header: {
        fontSize: 24,
        fontWeight: 'bold' as const,
    },
    subheader: {
        fontSize: 18,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 14,
        fontWeight: 'normal' as const,
    },
    caption: {
        fontSize: 12,
        color: colors.textSecondary,
    },
};

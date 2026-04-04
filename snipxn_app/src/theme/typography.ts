export const createTypography = (isTablet: boolean) => ({
  h1: isTablet
    ? 'text-[35px] font-bold tracking-[-0.04em] leading-[40px]'
    : 'text-[30px] font-bold tracking-[-0.04em] leading-[34px]',
  h2: isTablet
    ? 'text-[25px] font-semibold tracking-[-0.03em] leading-[30px]'
    : 'text-[22px] font-semibold tracking-[-0.03em] leading-[27px]',
  h3: isTablet
    ? 'text-[18px] font-semibold tracking-[-0.02em] leading-[24px]'
    : 'text-[17px] font-semibold tracking-[-0.02em] leading-[22px]',
  body: isTablet ? 'text-[16px] leading-[26px]' : 'text-[15px] leading-[24px]',
  bodySmall: isTablet ? 'text-[14px] leading-[22px]' : 'text-[13px] leading-[20px]',
  caption: isTablet
    ? 'text-[12px] leading-[18px] uppercase tracking-[0.08em]'
    : 'text-[11px] leading-[16px] uppercase tracking-[0.08em]',
  code: isTablet ? 'text-[15px] font-mono leading-[24px]' : 'text-[13px] font-mono leading-[22px]',
});

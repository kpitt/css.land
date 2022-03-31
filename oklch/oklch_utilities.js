// utility functions for color conversions
// needs conversions.js

function sRGB_to_OKLCH(RGB) {
    // convert an array of gamma-corrected sRGB values
    // in the 0.0 to 1.0 range
    // to linear-light sRGB, then to CIE XYZ,
    // then convert XYZ to OKLab
    // and finally, convert to OKLCH

    return OKLab_to_OKLCH(XYZ_to_OKLab(lin_sRGB_to_XYZ(lin_sRGB(RGB))));
}

function P3_to_OKLCH(RGB) {
    // convert an array of gamma-corrected display-p3 values
    // in the 0.0 to 1.0 range
    // to linear-light display-p3, then to CIE XYZ,
    // then convert XYZ to OKLab
    // and finally, convert to OKLCH

    return OKLab_to_OKLCH(XYZ_to_OKLab(lin_P3_to_XYZ(lin_P3(RGB))));
}

function r2020_to_OKLCH(RGB) {
    // convert an array of gamma-corrected rec.2020 values
    // in the 0.0 to 1.0 range
    // to linear-light sRGB, then to CIE XYZ,
    // then convert XYZ to OKLab
    // and finally, convert to OKLCH

    return OKLab_to_OKLCH(XYZ_to_OKLab(lin_2020_to_XYZ(lin_2020(RGB))));
}

function OKLCH_to_sRGB(LCH) {
    // convert an array of OKLCH values
    // to OKLab, and then to XYZ,
    // then convert XYZ to linear-light sRGB
    // and finally to gamma corrected sRGB
    // for in-gamut colors, components are in the 0.0 to 1.0 range
    // out of gamut colors may have negative components
    // or components greater than 1.0
    // so check for that :)

    return gam_sRGB(XYZ_to_lin_sRGB(OKLab_to_XYZ(OKLCH_to_OKLab(LCH))));
}

function OKLCH_to_P3(LCH) {
    // convert an array of OKLCH values
    // to OKLab, and then to XYZ,
    // then convert XYZ to linear-light display-p3
    // and finally to gamma corrected display-p3
    // for in-gamut colors, components are in the 0.0 to 1.0 range
    // out of gamut colors may have negative components
    // or components greater than 1.0
    // so check for that :)

    return gam_P3(XYZ_to_lin_P3(OKLab_to_XYZ(OKLCH_to_OKLab(LCH))));
}

function OKLCH_to_r2020(LCH) {
    // convert an array of OKLCH values
    // to OKLab, and then to XYZ,
    // then convert XYZ to linear-light rec.2020
    // and finally to gamma corrected rec.2020
    // for in-gamut colors, components are in the 0.0 to 1.0 range
    // out of gamut colors may have negative components
    // or components greater than 1.0
    // so check for that :)

    return gam_2020(XYZ_to_lin_2020(OKLab_to_XYZ(OKLCH_to_OKLab(LCH))));
}

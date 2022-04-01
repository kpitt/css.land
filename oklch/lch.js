const supportsP3 = self.CSS && CSS.supports("color", "color(display-p3 0 1 0)");

const sRGB_space = {
	from_lch: OKLCH_to_sRGB,
	to_lch: sRGB_to_OKLCH,
}

const P3_space = {
	from_lch: OKLCH_to_P3,
	to_lch: P3_to_OKLCH,
}

const r2020_space = {
	from_lch: OKLCH_to_r2020,
	to_lch: r2020_to_OKLCH,
}

function alpha_to_string(a = 100) {
	return (a < 100? ` / ${a}%` : "");
}

function LCH_to_r2020_string(l, c, h, a = 100) {
	return "color(rec2020 " + OKLCH_to_r2020([+l / 100, +c, +h]).map(x => {
		x = Math.round(x * 10000)/10000;
		return x;
	}).join(" ") + alpha_to_string(a) + ")";
}

function LCH_to_P3_string(l, c, h, a = 100, forceInGamut = false) {
	if (forceInGamut) {
		[l, c, h] = force_into_gamut(P3_space, l, c, h);
	}

	return "color(display-p3 " + OKLCH_to_P3([+l / 100, +c, +h]).map(x => {
		x = Math.round(x * 10000)/10000;
		return x;
	}).join(" ") + alpha_to_string(a) + ")";
}

function LCH_to_sRGB_string(l, c, h, a = 100, forceInGamut = false) {
	if (forceInGamut) {
		[l, c, h] = force_into_gamut(sRGB_space, l, c, h);
	}

	return "rgb(" + OKLCH_to_sRGB([+l / 100, +c, +h]).map(x => {
		return Math.round(x * 10000)/100 + "%";
	}).join(" ") + alpha_to_string(a) + ")";
}

function force_into_gamut(rgb_space, l, c, h) {
	// Algorithm adapted from the "color.js" `toGamut` method.
	// (see https://github.com/LeaVerou/color.js/blob/master/src/color.js)
	//
	// Moves an OKLCH color into the sRGB gamut by holding the l and h steady,
	// and adjusting the c via binary-search until the color is on the sRGB
	// boundary.  At each step, the color estimate is channel-clipped and
	// compared to the unclipped color using deltaEOK.  The clipped color is
	// used if it is indistinguishable (deltaE < 0.02) from the unclipped color.
	// This produces a higher-chroma mapping for certain problematic colors.
	//
	// See: https://www.w3.org/TR/css-color-4/#GM-chroma-local-MINDE

	// scale lightness to [0, 1] range for OKLCH calculations
	color = [+l / 100, +c, +h];

	if (isLCH_within(rgb_space, color)) {
		return [l, c, h];
	}

	const εE = 0.02;
	let clipped = clip_OKLCH(rgb_space, color);
	if (deltaEOKLCH(color, clipped) > εE) {
		let hiC = c;
		let loC = 0;
		const ε = .0001;
		c /= 2;

		// .0001 chosen fairly arbitrarily as "close enough"
		while (hiC - loC > ε) {
			color[1] = c;  // update chroma
			let clipped = clip_OKLCH(rgb_space, color);
			let deltaE = deltaEOKLCH(color, clipped);
			if (deltaE - εE < ε) {
				loC = c;
			} else {
				hiC = c;
			}
			c = (hiC + loC)/2;
		}

		// final clip to clean up out-of-gamut approximations
		color = clip_OKLCH(rgb_space, color);
	} else {
		color = clipped;
	}

	// scale lightness back up to the picker range on return
	color[0] *= 100;
	return color;
}

function isLCH_within(rgb_space, lch) {
	var rgb = rgb_space.from_lch(lch);
	const ε = .000005;
	return rgb.reduce((a, b) => a && b >= (0 - ε) && b <= (1 + ε), true);
}

function isLCH_within_sRGB(l, c, h) {
	return isLCH_within(sRGB_space, [+l / 100, +c, +h]);
}

function isLCH_within_P3(l, c, h) {
	return isLCH_within(P3_space, [+l / 100, +c, +h]);
}

function isLCH_within_r2020(l, c, h) {
	return isLCH_within(r2020_space, [+l / 100, +c, +h]);
}

function deltaEOKLCH(reference, sample) {
	// deltaEOK function from csswg.org samples expects OKLab colors
	return deltaEOK(OKLCH_to_OKLab(reference), OKLCH_to_OKLab(sample));
}

function clip_OKLCH(rgb_space, lch) {
	let clipped = rgb_space.from_lch(lch).map(
		c => Math.max(0, Math.min(1, c))
	);
	return rgb_space.to_lch(clipped);
}

// Generate gradient stops for the sliders
// (we need to use more to emulate proper interpolation)
function slider_stops(range, l, c, h, a, index) {
	return range.map(x => {
		args = [l, c, h, a, true];
		args[index] = x;
		var LCH_to_string = supportsP3? LCH_to_P3_string : LCH_to_sRGB_string;
		return LCH_to_string(...args);
	}).join(", ");
}

function CSS_color_to_LCH(str) {
	str = str || prompt("Enter any sRGB color format your browser recognizes, or a color(display-p3) color");

	if (!str) {
		return;
	}

	const prefixP3 = "color(display-p3 ";

	if (str.trim().indexOf(prefixP3) === 0) {
		var params = str.slice(prefixP3.length).match(/-?[\d.]+/g).map(x => +x);
		console.log(params);
		var lch = P3_to_OKLCH(params.slice(0, 3));
	}
	else {
		// Assume RGBA for now, normalize via computed style
		var dummy = document.createElement("_");
		document.body.appendChild(dummy);
		dummy.style.color = str;
		var computedStr = getComputedStyle(dummy).color;
		var params = computedStr.match(/-?[\d.]+/g).map(x => +x);

		params = params.map((x, i) => i < 3? x/255 : x);
		var lch = sRGB_to_OKLCH(params.slice(0, 3));
	}

	return {
		lightness: lch[0] * 100,
		chroma: lch[1],
		hue: lch[2],
		alpha: (params[3] || 1) * 100
	};
}

// Produce a default (not very good) name
function LCH_name(l, c, h) {
	h = h % 360;
	var ret = [];
	var baseColor;

	if (l < 45) {
		ret.push("Dark");
	}
	else if (l > 75) {
		ret.push("Light");
	}

	if (c > 0.025) {
		if (c < 0.1) {
			ret.push("Muted");
		}
		else if (c > 0.15) {
			if (l > 65) {
				ret.push("Bright");
			}
		}

		// Chromatic
		for (let [hue, baseColor] of Object.entries({
			10: "Pink",
			35: "Red",
			70: "Orange",
			115: "Yellow",
			155: "Green",
			210: "Cyan",
			270: "Blue",
			310: "Purple",
			335: "Magenta",
			360: "Pink"
		})) {
			if (h <= hue) {
				ret.push(baseColor);
				break;
			}
		}
	}
	else {
		if (c > 0.003) {
			ret.unshift(h < 125 || h > 300 ? "Warm": "Cool");
		}

		ret.push("Gray");
	}

	ret = ret.join(" ");

	if (/Yellow$/.test(ret) && l < 40) {
		// Dark Yellow is an oxymoron
		ret = "Brown";
	}

	return ret;
}

// Select text in readonly input fields when you focus them
document.addEventListener("click", evt => {
	if (evt.target.matches("input[readonly]")) {
		evt.target.select();
	}
});

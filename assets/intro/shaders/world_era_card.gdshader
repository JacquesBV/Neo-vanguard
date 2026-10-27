shader_type canvas_item;
// ============================================================================
// WORLD ERA CARD — Signature visuelle subtile et nette des 5 familles
// technologiques à travers les 8 mondes sacrés (FanBoy -> Polytron 32),
// préservant la finesse des illustrations HD tout en typant chaque famille :
//   0 : Portable 8 bits (teinte émeraude matricielle + micro-grille LCD douce)
//   1 : Portable 32 bits (éclat cristal + micro-trame TFT couleur)
//   2 : Consoles de salon 8 bits (contraste vif + fines lignes phosphore CRT)
//   3 : Consoles 16 bits (richesse chromatique + halo harmonique + scanlines fines)
//   4 : Console 32 bits (tramage optique fin + reflets laser 3D)
// ============================================================================

uniform int family_mode = 0;
uniform float time_sec = 0.0;
uniform float effect_mix : hint_range(0.0, 1.0) = 0.36;
uniform vec4 world_accent : source_color = vec4(0.22, 0.88, 1.0, 1.0);

float bayer4(vec2 p) {
	ivec2 ip = ivec2(mod(p, 4.0));
	int idx = ip.y * 4 + ip.x;
	float m[16] = float[16](
		0.0,  8.0,  2.0, 10.0,
		12.0, 4.0, 14.0,  6.0,
		3.0, 11.0,  1.0,  9.0,
		15.0, 7.0, 13.0,  5.0
	);
	return (m[idx] / 16.0) - 0.5;
}

void fragment() {
	vec4 base = texture(TEXTURE, UV);
	vec3 fx_col = base.rgb;

	if (family_mode == 0) {
		// Famille I — Portable 8 bits (FanBoy) : harmonie monochrome émeraude 4 nuances + fine grille
		float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
		lum = clamp(lum + bayer4(UV * vec2(220.0, 180.0)) * 0.10, 0.0, 1.0);
		float q = floor(lum * 5.0 + 0.5) / 5.0;
		vec3 dark_em = vec3(0.06, 0.13, 0.07);
		vec3 bright_em = vec3(0.68, 0.92, 0.36);
		fx_col = mix(dark_em, bright_em, q);
		vec2 cell = fract(UV * vec2(220.0, 180.0));
		float lcd = mix(0.88, 1.0, step(0.12, cell.x) * step(0.12, cell.y));
		fx_col *= lcd;
	} else if (family_mode == 1) {
		// Famille II — Portable 32 bits (FanBoy Adventure) : clarté TFT 15 bits lumineuse
		vec3 s = floor(base.rgb * 20.0 + 0.5) / 20.0;
		fx_col = pow(clamp(s, 0.0, 1.0), vec3(0.92)) * vec3(1.03, 1.06, 1.08);
		float sub_grid = 0.94 + 0.06 * sin(UV.y * 280.0 * 3.14159265);
		fx_col *= sub_grid;
	} else if (family_mode == 2) {
		// Famille III — Consoles de salon 8 bits (NEXUS 8 / Masterion 8) : contraste CRT franc
		vec3 s = floor(base.rgb * 10.0 + 0.5) / 10.0;
		float scan = 0.88 + 0.12 * sin(UV.y * 260.0 * 3.14159265);
		fx_col = s * scan + world_accent.rgb * 0.05;
	} else if (family_mode == 3) {
		// Famille IV — Consoles 16 bits (NEXUS 16 / MegaStorm 16 / Arcadion HCS) : éclat arcade
		float scan = 0.91 + 0.09 * sin(UV.y * 320.0 * 3.14159265);
		float hi = max(0.0, dot(base.rgb, vec3(0.333)) - 0.58) * 0.45;
		fx_col = base.rgb * scan + world_accent.rgb * hi;
	} else {
		// Famille V — Console 32 bits (Polytron 32) : tramage Bayer fin + balayage laser optique
		vec3 d = base.rgb + bayer4(UV * vec2(436.0, 360.0)) * 0.045;
		fx_col = floor(clamp(d, 0.0, 1.0) * 28.0 + 0.5) / 28.0;
		float laser_sweep = exp(-pow((UV.y - fract(time_sec * 0.28)) * 14.0, 2.0));
		fx_col += world_accent.rgb * laser_sweep * 0.16;
	}

	vec3 final_col = mix(base.rgb, fx_col, effect_mix);
	COLOR = vec4(final_col * COLOR.rgb, base.a * COLOR.a);
}

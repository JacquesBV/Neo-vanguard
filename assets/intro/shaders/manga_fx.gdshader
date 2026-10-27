shader_type canvas_item;
// ============================================================================
// MANGA FX OVERLAY — Speedlines animées (radiales & diagonales), trame manga
// (screentone 45°), flash d'impact noir/blanc anime et vignettage cinéma.
// Compatible Godot 4.3 → 4.7+ (GL Compatibility, Mobile, Forward+).
// ============================================================================

uniform float time_sec = 0.0;
uniform float speed_intensity : hint_range(0.0, 1.0) = 0.0;
uniform vec2 speed_center = vec2(0.5, 0.45);
uniform float diagonal_mode : hint_range(0.0, 1.0) = 0.0;
uniform float diagonal_angle = -0.52;
uniform vec4 speed_color : source_color = vec4(0.85, 0.96, 1.0, 1.0);
uniform float halftone_amount : hint_range(0.0, 1.0) = 0.25;
uniform float impact_flash : hint_range(0.0, 1.0) = 0.0;
uniform vec4 impact_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.45;
uniform float scanline_alpha : hint_range(0.0, 0.3) = 0.04;

float hash11(float p) {
	p = fract(p * 0.1031);
	p *= p + 33.33;
	p *= p + p;
	return fract(p);
}

void fragment() {
	vec2 uv = UV;
	vec2 aspect_uv = vec2(uv.x, uv.y * 1.7916);
	vec2 aspect_center = vec2(speed_center.x, speed_center.y * 1.7916);

	// 1. Speedlines manga (radiales : 集中線 / diagonales : 流線)
	float line_mask = 0.0;
	if (speed_intensity > 0.005) {
		// Radiales
		vec2 d = aspect_uv - aspect_center;
		float dist = length(d);
		float ang = atan(d.y, d.x);
		float sector = floor((ang + 3.14159265) * 46.0 + floor(time_sec * 24.0) * 7.13);
		float rnd = hash11(sector);
		float inner_r = mix(0.26, 0.68, rnd * rnd);
		float angular_sharp = abs(fract((ang + 3.14159265) * 46.0) - 0.5) * 2.0;
		float radial_line = smoothstep(inner_r, inner_r + 0.18, dist) * (1.0 - smoothstep(0.0, 0.24 * rnd, angular_sharp));

		// Diagonales d'action
		float cs = cos(diagonal_angle);
		float sn = sin(diagonal_angle);
		vec2 rot = vec2(aspect_uv.x * cs - aspect_uv.y * sn, aspect_uv.x * sn + aspect_uv.y * cs);
		float stripe_id = floor(rot.y * 68.0 + floor(time_sec * 28.0) * 3.7);
		float drnd = hash11(stripe_id + 91.7);
		float streak_phase = fract(rot.x * 0.9 - time_sec * (3.2 + drnd * 2.5) + drnd * 5.0);
		float diag_line = step(0.84, drnd) * smoothstep(0.35, 0.95, streak_phase) * (1.0 - abs(fract(rot.y * 68.0) - 0.5) * 2.0);

		line_mask = mix(radial_line, diag_line, diagonal_mode) * speed_intensity;
	}

	// 2. Vignette cinéma + trame manga 45° dans les coins
	vec2 vc = uv - vec2(0.5);
	float vig = clamp(dot(vc * vec2(1.35, 1.15), vc * vec2(1.35, 1.15)) * 1.65, 0.0, 1.0);
	float tone_mask = 0.0;
	if (halftone_amount > 0.005) {
		vec2 px = uv * vec2(480.0, 860.0);
		vec2 rg = vec2(px.x * 0.7071 - px.y * 0.7071, px.x * 0.7071 + px.y * 0.7071) / 5.5;
		vec2 cell = fract(rg) - vec2(0.5);
		float dot_d = length(cell) * 1.42;
		float radius = vig * halftone_amount * 0.85;
		tone_mask = (1.0 - smoothstep(radius - 0.08, radius + 0.08, dot_d)) * vig * 0.55;
	}

	// 3. Fines lignes de balayage haute précision
	float scan = sin(uv.y * 860.0 * 3.14159265) * 0.5 + 0.5;
	float scan_dark = scan * scanline_alpha;

	// Assemblage couche alpha
	vec3 col = vec3(0.01, 0.015, 0.035);
	float alpha = clamp(vig * vignette_strength + tone_mask + scan_dark, 0.0, 0.88);

	// Fusion additive des speedlines manga
	col = mix(col, speed_color.rgb, clamp(line_mask * 1.35, 0.0, 1.0));
	alpha = clamp(alpha + line_mask * speed_color.a * 0.82, 0.0, 0.96);

	// 4. Impact Frame (flash manga dramatique sur les drops à 134 BPM)
	if (impact_flash > 0.005) {
		col = mix(col, impact_color.rgb, impact_flash);
		alpha = max(alpha, impact_flash * 0.92);
	}

	COLOR = vec4(col, alpha);
}

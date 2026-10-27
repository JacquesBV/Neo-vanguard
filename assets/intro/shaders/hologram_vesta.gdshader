shader_type canvas_item;
// ============================================================================
// HOLOGRAM VESTA — Rendu d'archive vivante holographique (matérialisation par
// faisceau cyan/lavande, micro-lignes de projection et aura vocale réactive).
// ============================================================================

uniform float time_sec = 0.0;
uniform float materialize : hint_range(0.0, 1.0) = 1.0;
uniform float holo_strength : hint_range(0.0, 1.0) = 0.28;
uniform float voice_amp : hint_range(0.0, 1.0) = 0.0;
uniform vec4 tint_glow : source_color = vec4(0.38, 0.86, 1.0, 1.0);

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	// Balayage de matérialisation vertical du bas vers le haut
	float vis = smoothstep(1.0 - materialize - 0.06, 1.0 - materialize + 0.04, 1.0 - UV.y);
	if (materialize >= 0.99) {
		vis = 1.0;
	}
	float beam_band = (1.0 - abs((1.0 - UV.y) - (1.0 - materialize)) * 16.0);
	beam_band = clamp(beam_band, 0.0, 1.0) * step(0.01, materialize) * step(materialize, 0.98);

	// Fines ondes holographiques ascendantes
	float scan1 = sin(UV.y * 260.0 - time_sec * 5.5) * 0.5 + 0.5;
	float scan2 = sin(UV.y * 38.0 + time_sec * 2.1) * 0.5 + 0.5;
	float holo_wave = (scan1 * 0.35 + scan2 * 0.65) * holo_strength;

	// Détection de contour alpha pour un liseré lumineux réactif à la voix de Vesta
	vec2 px = TEXTURE_PIXEL_SIZE * 2.2;
	float a_around = (
		texture(TEXTURE, UV + vec2(px.x, 0.0)).a +
		texture(TEXTURE, UV - vec2(px.x, 0.0)).a +
		texture(TEXTURE, UV + vec2(0.0, px.y)).a +
		texture(TEXTURE, UV - vec2(0.0, px.y)).a
	) * 0.25;
	float rim = clamp(tex.a - a_around, 0.0, 1.0) * (1.2 + voice_amp * 2.0);

	vec3 col = tex.rgb;
	col += tint_glow.rgb * (holo_wave * 0.24 + rim * 0.55 + voice_amp * 0.10 + beam_band * 0.95);
	float out_a = tex.a * vis * COLOR.a;
	COLOR = vec4(col * COLOR.rgb, out_a);
}

shader_type canvas_item;
// ============================================================================
// VORAX GLITCH — Déchirures électromagnétiques cramoisies, aberration RVB
// asservie à l'enveloppe vocale robotique et pulsation mécanique menaçante.
// ============================================================================

uniform float time_sec = 0.0;
uniform float glitch_amount : hint_range(0.0, 1.0) = 0.18;
uniform float voice_amp : hint_range(0.0, 1.0) = 0.0;
uniform float crimson_pulse : hint_range(0.0, 1.0) = 0.35;

float hash12(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

void fragment() {
	float total_g = clamp(glitch_amount + voice_amp * 0.45, 0.0, 1.0);
	float band = floor(UV.y * 34.0);
	float tick = floor(time_sec * 18.0);
	float r = hash12(vec2(band, tick));
	float tear = step(1.0 - total_g * 0.28, r) * (hash12(vec2(tick, band)) - 0.5) * 0.045 * total_g;

	vec2 uv_base = vec2(clamp(UV.x + tear, 0.0, 1.0), UV.y);
	float chroma = (0.002 + voice_amp * 0.006 + abs(tear) * 0.35) * total_g;

	float cr = texture(TEXTURE, vec2(clamp(uv_base.x + chroma, 0.0, 1.0), uv_base.y)).r;
	vec4 cg = texture(TEXTURE, uv_base);
	float cb = texture(TEXTURE, vec2(clamp(uv_base.x - chroma, 0.0, 1.0), uv_base.y)).b;
	float ar = texture(TEXTURE, vec2(clamp(uv_base.x + chroma, 0.0, 1.0), uv_base.y)).a;

	vec3 col = vec3(cr, cg.g, cb);
	// Renforcement de l'incandescence rouge des yeux et plaques de Vorax
	float red_dom = clamp(col.r - max(col.g, col.b) * 1.15, 0.0, 1.0);
	float pulse = 0.5 + 0.5 * sin(time_sec * 7.0);
	col += vec3(1.0, 0.12, 0.08) * red_dom * (crimson_pulse * (0.45 + 0.55 * pulse) + voice_amp * 0.65);

	float out_a = max(cg.a, ar * 0.55) * COLOR.a;
	COLOR = vec4(col * COLOR.rgb, out_a);
}

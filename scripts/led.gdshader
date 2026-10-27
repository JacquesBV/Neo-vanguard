shader_type canvas_item;
uniform vec4 light_color : source_color = vec4(0.28,0.89,0.63,1.0);
uniform float energy : hint_range(0.0,1.0) = 1.0;
void fragment() {
 vec4 sample_color = texture(TEXTURE,UV);
 float brightness = max(sample_color.r,max(sample_color.g,sample_color.b));
 COLOR = vec4(light_color.rgb*brightness*energy,sample_color.a);
}

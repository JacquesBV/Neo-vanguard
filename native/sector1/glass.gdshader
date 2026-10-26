shader_type canvas_item;
render_mode unshaded;
uniform vec2 raster = vec2(160.0,287.0);
void fragment() {
    vec4 c = texture(TEXTURE,UV);
    // Physical LCD lattice and fixed room reflection; source module 51.
    vec2 px = fract(UV*raster);
    float grid = (px.x < .16 || px.y < .16) ? .055 : 0.0;
    c.rgb = mix(c.rgb,vec3(.137,.169,.114),grid);
    float shade = mix(.12,0.0,smoothstep(0.0,.12,UV.y)) + .10*smoothstep(.72,1.0,UV.y);
    c.rgb = mix(c.rgb,vec3(.098,.133,.071),shade);
    float diagonal = (UV.x+1.0-UV.y)*.5;
    float reflection = .17*smoothstep(.52,1.0,diagonal);
    c.rgb = mix(c.rgb,vec3(.98,.988,.922),reflection);
    COLOR = c;
}

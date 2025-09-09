const ColorShader = `
float GammaToLinear(float c)
{
    return pow( c, 2.2 );
}

float LinearToGamma(float c)
{
    return pow( c, 1.0 / 2.2 );
}

float SRGBToLinear(float c)
{
    return ( c < 0.04045 ) ? c * 0.0773993808 : pow( c * 0.9478672986 + 0.0521327014, 2.4 );
}

float LinearToSRGB(float c) {
    return ( c < 0.0031308 ) ? c * 12.92 : 1.055 * ( pow( c, 0.41666 ) ) - 0.055;
}

vec3 SRGBToLinear(vec3 c)
{
    float r = SRGBToLinear(c.r);
    float g = SRGBToLinear(c.g);
    float b = SRGBToLinear(c.b);
    return vec3(r,g,b);
} 

vec4 SRGBToLinear(vec4 c)
{
    return vec4(SRGBToLinear(c.rgb),c.a);
} 

vec3 LinearToSRGB(vec3 c)
{
    float r = LinearToSRGB(c.r);
    float g = LinearToSRGB(c.g);
    float b = LinearToSRGB(c.b);
    return vec3(r,g,b);
} 

vec4 LinearToSRGB(vec4 c)
{
    return vec4(LinearToSRGB(c.rgb),c.a);
} 

`;


export { ColorShader }
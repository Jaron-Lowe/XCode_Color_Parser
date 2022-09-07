/**
 * Represents a color's value and its usage instance details.
 */
export class Color {
    fileName: string | null | undefined
    parentName: string | null | undefined
    parentId: string | null | undefined
    key: string | null | undefined
    colorSpace: string | null | undefined
    customColorSpace: string | null | undefined
    colorName: string | null | undefined
    // 0-255
    red: number = 255
    green: number = 255
    blue: number = 255
    // 0-1.0
    alpha: number = 1.0

    constructor(
        fileName: string | null | undefined,
        parentName: string | null | undefined,
        parentId: string | null | undefined,
        key: string | null | undefined,
        colorSpace: string | null | undefined,
        customColorSpace: string | null | undefined,
        colorName: string | null | undefined,
        white: string | null | undefined,
        red: string | null | undefined,
        green: string | null | undefined,
        blue: string | null | undefined,
        alpha: string | null | undefined
    ) {
        this.fileName = fileName
        this.parentName = parentName
        this.parentId = parentId
        this.key = key
        this.colorSpace = colorSpace
        this.customColorSpace = customColorSpace

        this.colorName = colorName

        if (white) {
            const whiteValue = Color.parseColorValue(white, true)
            this.red = whiteValue ?? this.red
            this.green = whiteValue ?? this.green
            this.blue = whiteValue ?? this.blue
        }
        else {
            this.red = Color.parseColorValue(red, true) ?? this.red
            this.green = Color.parseColorValue(green, true) ?? this.green
            this.blue = Color.parseColorValue(blue, true) ?? this.blue
        }
        
        this.alpha = Math.round((+(alpha ?? this.alpha)) * 10) / 10

        // Pre-populate name as grayXXXa0.X if it's a gray value.
        if (!this.colorName) {
            if (this.alpha === 0) {
                this.colorName = "clear"
            } 
            else if (this.red === this.green && this.green === this.blue) {
                const alphaLabel = (this.alpha === 1) ? "" : `-${this.alpha * 100}%`
                this.colorName = `gray${this.red}${alphaLabel}`
            }
        }
    }

    // Returns a string in rgba(x,x,x,x) format or colorName.
    rawValue(): string {
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`
    }

    name() {
        return this.colorName ?? ""
    }

    /**
     * 
     * @param value The floating point, hex, or int value to parse.
     * @param isFloatingPoint Indicates whether the origin is known to be from a floating point origin. Storyboards return 1 instead of 1.0 for a maxed out floating point.
     * @returns A color component value in the range of 0-255.
     */
    static parseColorValue(value: string | null | undefined, isFloatingPoint: boolean = false) : number | null {
        if (value == null) { return null }
        if (value.includes(".") || isFloatingPoint) {
            return Math.round(+value * 255)
        } else if (value.includes("0x")) {
            return parseInt(value, 16)
        }
        return +value
    }
}
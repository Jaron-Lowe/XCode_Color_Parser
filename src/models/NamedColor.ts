import { Color } from "./Color"
import { XCColor } from "./XCModels"

/**
 * Represents a color with an associated name.
 */
export class NamedColor implements INamedColor {
    name: string = ""
    color: Color

    constructor(name: string, color: Color) {
        this.name = name
        this.color = color
    }

    rawValue(): string {
        return this.color.rawValue()
    }
}

/**
 * Represents a color from an XCAsset file with an associated name.
 */
export class NamedAssetColor implements INamedColor {
    name: string = ""
    color: XCColor

    constructor(name: string, color: XCColor) {
        this.name = name
        this.color = color
    }

    rawValue(): string {
        return this.color.rawValue()
    }
}
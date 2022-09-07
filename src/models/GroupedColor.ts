import { Color } from "./Color"

/**
 * A collection of names and color usage instances grouped by the rawValue of the colors.
 */
export class GroupedColor {
    names: Set<string> = new Set()
    colors: Color[] = []
    rawValue: string = "" 

    addNamedColor(namedColor: INamedColor) {
        this.names.add(namedColor.name)
        if (this.rawValue === "") {
            this.rawValue = namedColor.rawValue()
        }
    }

    addColor(color: Color) {
        if (color.colorName) {
            this.names.add(color.colorName)
        }
        if (this.rawValue === "") {
            this.rawValue = color.rawValue()
        }
        this.colors.push(color)
    }

    debugName() : string {
        if (this.names.size) {
            return [...this.names].join(", ")
        }
        return "tbd"
    }

    outputName() : string {
        for (const name of this.names) {
            if (/\d/.test(name)) {
                return name
            }
        }

        if (this.names.size > 0) {
            return [...this.names][0]
        }
        
        return "tbd"
    }
}
import { stringify } from 'querystring'
import { Color } from './Color.js' 

export class XCContent {
    info: XCInfo = new XCInfo()

    constructor(object?: any) {
        this.info = object?.info ? new XCInfo(object.info) : this.info
    }
}

class XCInfo {
    author: string = "xcode"
    version: number = 1

    constructor(object?: any) {
        this.author = object?.author ?? this.author
        this.version = object?.version ?? this.version
    }
}

export class XCColorContent extends XCContent {
    colors: XCColor[] = []

    constructor(object?: any) {
        super(object)
        if (object?.colors) {
            this.colors = object.colors.map((x: any) => {
                return new XCColor(x)
            })
        }
    }

    static withColor(colorRawValue: string) : XCColorContent {
        const colorContent = new XCColorContent()
        const xcColor = new XCColor()
        const colorDetails = new XCColorDetails()
        const colorComponents = XCColorComponents.withColor(colorRawValue)
        
        colorContent.colors.push(xcColor)
        xcColor.color = colorDetails
        colorDetails.components = colorComponents

        return colorContent
    }

    parsedAnyIdiomColor() : XCColor | undefined {
        const xcColor = this.colors.find((x) => {
            return !x.appearances
        })
        return xcColor
    }
}

export class XCColor {
    appearances?: XCColorAppearance[]
    color?: XCColorDetails
    idiom: string = "universal"

    constructor(object?: any) {
        if (object?.appearances) {
            this.appearances = object.appearances.map((x: any) => {
                new XCColorAppearance(x)
            })
        }
        this.color = object?.color ? new XCColorDetails(object.color) : this.color
        this.idiom = object?.idiom ?? this.idiom
    }

    rawValue() : string {
        return this.color?.components?.rawValue() ?? "No Color Data"
    }
}

class XCColorAppearance {
    appearance: string = ""
    value: string = ""
    
    constructor(object?: any) {
        this.appearance = object.appearance ?? this.appearance
        this.value = object.value ?? this.value
    }
}

class XCColorDetails {
    colorSpace: string = "srgb"
    components?: XCColorComponents

    constructor(object?: any) {
        this.colorSpace = object?.colorSpace ?? this.colorSpace
        this.components = object?.components ? new XCColorComponents(object.components) : this.components
    }
}

class XCColorComponents {
    // 0-255
    red: number = 255
    green: number = 255
    blue: number = 255
    // 0-1.0
    alpha: number = 1.0

    constructor(object?: any) {

        if (object?.white) {
            const whiteValue = Color.parseColorValue(object?.white)
            this.red = whiteValue ?? this.red
            this.green = whiteValue ?? this.green
            this.blue = whiteValue ?? this.blue
        }
        else {
            this.red = Color.parseColorValue(object?.red) ?? this.red
            this.green = Color.parseColorValue(object?.green) ?? this.green
            this.blue = Color.parseColorValue(object?.blue) ?? this.blue
        }        
        this.alpha = Math.round((+(object?.alpha ?? this.alpha)) * 10) / 10
    }

    toJSON() {
        return {
            red: `${this.red}`,
            green: `${this.green}`,
            blue: `${this.blue}`,
            alpha: this.alpha.toFixed(1),
        }
    }

    static withColor(colorRawValue: string): XCColorComponents {
        const components = new XCColorComponents()
        let regex = /rgba\((\d+), (\d+), (\d+), ((0*\.)*\d+)\)/
        const parts = colorRawValue.match(regex)
        if (parts) {
            components.red = +parts[1]
            components.green = +parts[2]
            components.blue = +parts[3]
            components.alpha = +parts[4]
        }
        return components
    }

    rawValue() : string {
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`
    }
}
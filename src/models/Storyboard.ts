import * as jsdom from 'jsdom'
import { Color } from './Color.js'
import { NamedColor } from './NamedColor.js'

/**
 * Represents a parsed UIKitView file containing named colors, system colors, and color usages.
 */
export class Storyboard {
    name: string = ""
    namedColors: NamedColor[] = []
    colors: Color[] = []

    constructor(name: string, fileText: string) {
        this.name = name
        this.parseFileText(fileText)
    }

    parseFileText(xmlText: string) {
        const xmlData = new jsdom.JSDOM(xmlText, { contentType: "text/xml" }).window.document
        this.parseNamedColors(xmlData)
        this.parseColors(xmlData)
    }

    parseNamedColors(xmlData: Document) {
        const namedColorTags = xmlData.querySelectorAll("namedColor, systemColor")
        let colors = []
        for (const tag of namedColorTags) {
            const childColorTag = tag.querySelector("color")
            let color = new Color(
                this.name,
                null, null, null,
                childColorTag?.getAttribute("colorSpace"),
                childColorTag?.getAttribute("customColorSpace"),

                tag.getAttribute("name"),

                childColorTag?.getAttribute("white"),
                childColorTag?.getAttribute("red"),
                childColorTag?.getAttribute("green"),
                childColorTag?.getAttribute("blue"),
                childColorTag?.getAttribute("alpha")
            )
            let namedColor = new NamedColor(tag.getAttribute("name") ?? "", color)
            colors.push(namedColor)
        }
        this.namedColors = colors
    }

    parseColors(xmlData: Document) {
        const colorTags = xmlData.getElementsByTagName("color")
        let colors = []
        for (const tag of colorTags) {
            const id = tag.parentElement?.getAttribute("id") ?? tag.parentElement?.parentElement?.getAttribute("id")
            if (id) {
                const colorName = tag.getAttribute("systemColor") ?? tag.getAttribute("cocoaTouchSystemColor") ?? tag.getAttribute("name")
                const namedColor = this.namedColors.find((x) => {
                    return x.name === colorName
                })

                let color = new Color(
                    this.name,
                    tag.parentElement?.nodeName,
                    id,
                    tag.getAttribute("key"),
                    tag.getAttribute("colorSpace"),
                    tag.getAttribute("customColorSpace"),

                    colorName,

                    tag.getAttribute("white"),
                    tag.getAttribute("red"),
                    tag.getAttribute("green"),
                    tag.getAttribute("blue"),
                    tag.getAttribute("alpha")
                )
                if (namedColor) {
                    color.red = namedColor.color.red
                    color.green = namedColor.color.green
                    color.blue = namedColor.color.blue
                    color.alpha = namedColor.color.alpha
                }
                colors.push(color)
            }
        }
        this.colors = colors
    }
}
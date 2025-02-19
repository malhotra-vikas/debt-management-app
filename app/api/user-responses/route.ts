import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR)
}

export async function POST(req: NextRequest) {
    const { userId, responses } = await req.json()

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const filePath = path.join(DATA_DIR, `${userId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(responses, null, 2))

    return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const filePath = path.join(DATA_DIR, `${userId}.json`)

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ responses: [] })
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")
    const responses = JSON.parse(fileContent)

    return NextResponse.json({ responses })
}


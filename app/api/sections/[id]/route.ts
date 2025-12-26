import { NextRequest, NextResponse } from 'next/server'

// Section model has been removed - use Category instead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Sections have been replaced by Categories. Please use /api/categories instead.' },
    { status: 410 }
  )
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Sections have been replaced by Categories. Please use /api/categories instead.' },
    { status: 410 }
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Sections have been replaced by Categories. Please use /api/categories instead.' },
    { status: 410 }
  )
}

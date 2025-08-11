import { NextRequest, NextResponse } from 'next/server';
import { PersonnelRecordService } from '@/services/database-adapter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fullName = searchParams.get('fullName');

    if (!fullName) {
      return NextResponse.json({ error: 'Missing fullName parameter' }, { status: 400 });
    }

    const comments = await PersonnelRecordService.getComments(fullName);

    if (!comments) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fullName, comment } = await request.json();

    if (!fullName || !comment) {
      return NextResponse.json({ error: 'Missing fullName or comment' }, { status: 400 });
    }

    // Add comment to MongoDB
    const updatedRecord = await PersonnelRecordService.addComment(fullName, comment);

    if (!updatedRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

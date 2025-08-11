import { NextRequest, NextResponse } from 'next/server';
import { PersonnelRecordService } from '@/services/database-adapter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const status = searchParams.get('status');

    let records;
    
    if (zone && zone !== 'All') {
      records = await PersonnelRecordService.searchByZone(zone);
    } else if (status && status !== 'All') {
      records = await PersonnelRecordService.searchByStatus(status);
    } else {
      records = await PersonnelRecordService.getAll();
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching personnel records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.fullName || !data.cin || !data.zone) {
      return NextResponse.json({ 
        error: 'Missing required fields: fullName, cin, zone' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingRecord = await PersonnelRecordService.getByFullName(data.fullName);
    if (existingRecord) {
      return NextResponse.json({ 
        error: 'A profile with this name already exists' 
      }, { status: 400 });
    }

    // Set default values
    const recordData = {
      ...data,
      dateAdded: data.dateAdded || new Date().toISOString().slice(0, 10),
      recruitDate: data.recruitDate || new Date().toISOString().slice(0, 10),
      status: data.status || 'Recruit',
      technicalTrainingCompleted: data.technicalTrainingCompleted || false,
      theoreticalTrainingCompleted: data.theoreticalTrainingCompleted || false,
      comments: data.comments || []
    };

    const newRecord = await PersonnelRecordService.create(recordData);
    
    return NextResponse.json(newRecord);
  } catch (error) {
    console.error('Error creating personnel record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { fullName, fields } = await request.json();
    
    if (!fullName) {
      return NextResponse.json({ 
        error: 'Missing fullName parameter' 
      }, { status: 400 });
    }

    const updatedRecord = await PersonnelRecordService.update(fullName, fields);
    
    if (!updatedRecord) {
      return NextResponse.json({ 
        error: 'Personnel record not found' 
      }, { status: 404 });
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error updating personnel record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fullName = searchParams.get('fullName');
    
    if (!fullName) {
      return NextResponse.json({ 
        error: 'Missing fullName parameter' 
      }, { status: 400 });
    }

    const deleted = await PersonnelRecordService.delete(fullName);
    
    if (!deleted) {
      return NextResponse.json({ 
        error: 'Personnel record not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting personnel record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import {catalog,research} from '@/lib/server';
export async function GET(){return Response.json({products:await catalog(),assessments:await research()});}

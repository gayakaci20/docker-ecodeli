import { prisma } from '../../src/lib/prisma';

export default async function handler(req, res) {
  try {
    console.log(`Handling ${req.method} request to /api/rides`);
    
    if (req.method === 'GET') {
      try {
        console.log('Fetching rides');
        const { status, userId } = req.query;
        
        // Build where clause
        const where = {};
        
        if (status) {
          where.status = status;
        }
        
        if (userId) {
          where.userId = userId;
        }
        
        const rides = await prisma.ride.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            matches: {
              select: {
                id: true,
                status: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        console.log(`Found ${rides.length} rides`);
        return res.status(200).json(rides);
      } catch (error) {
        console.error('Rides fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch rides', details: error.message });
      }
    } else if (req.method === 'POST') {
      try {
        const data = req.body;
        console.log('Received ride data:', JSON.stringify(data, null, 2));
        
        // Validate user ID is provided
        if (!data.userId) {
          console.error('Missing userId in ride creation request');
          return res.status(400).json({ 
            error: 'userId is required', 
            details: 'A valid user ID must be provided'
          });
        }
        
        console.log(`Looking up user with ID: ${data.userId}`);
        // Validate that the user exists
        try {
          const userExists = await prisma.user.findUnique({
            where: { id: data.userId }
          });
          
          // If user doesn't exist, return error
          if (!userExists) {
            console.error(`User with ID ${data.userId} not found`);
            return res.status(400).json({ 
              error: 'Invalid userId', 
              details: `No user found with ID: ${data.userId}`
            });
          }
          
          console.log(`User found: ${userExists.email}`);
        } catch (userLookupError) {
          console.error('Error looking up user:', userLookupError);
          return res.status(500).json({ 
            error: 'User lookup failed', 
            details: userLookupError.message 
          });
        }

        // Prepare the data object
        const rideData = {
          userId: data.userId,
          startLocation: data.startLocation || '',
          endLocation: data.endLocation || '',
          startLat: data.startLat ? parseFloat(data.startLat) : 0,
          startLng: data.startLng ? parseFloat(data.startLng) : 0,
          endLat: data.endLat ? parseFloat(data.endLat) : 0,
          endLng: data.endLng ? parseFloat(data.endLng) : 0,
          departureTime: data.departureTime ? new Date(data.departureTime) : new Date(),
          estimatedArrivalTime: data.estimatedArrivalTime ? new Date(data.estimatedArrivalTime) : null,
          vehicleType: data.vehicleType || null,
          availableSeats: data.availableSeats ? parseInt(data.availableSeats) : null,
          maxPackageWeight: data.maxPackageWeight ? parseFloat(data.maxPackageWeight) : null,
          maxPackageSize: data.maxPackageSize || null,
          pricePerKg: data.pricePerKg ? parseFloat(data.pricePerKg) : null,
          pricePerSeat: data.pricePerSeat ? parseFloat(data.pricePerSeat) : null,
          notes: data.notes || null,
          status: 'AVAILABLE',
        };
        
        console.log('Creating ride with prepared data:', JSON.stringify(rideData, null, 2));

        // Create the ride
        try {
          const newRide = await prisma.ride.create({
            data: rideData,
          });

          console.log('Ride created successfully:', JSON.stringify(newRide, null, 2));
          return res.status(201).json(newRide);
        } catch (createError) {
          console.error('Ride creation database error:', createError);
          return res.status(500).json({ 
            error: 'Failed to create ride in database', 
            details: createError.message
          });
        }
      } catch (processError) {
        console.error('Error processing ride data:', processError);
        return res.status(500).json({ 
          error: 'Failed to process ride data', 
          details: processError.message
        });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (topLevelError) {
    console.error('Top-level error in rides API:', topLevelError);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: topLevelError.message 
    });
  }
} 
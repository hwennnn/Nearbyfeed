import { PrismaClient, type Post } from '@prisma/client';
import { distanceTo } from 'geolocation-utils';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const lat = 37.7749;
  const lon = -122.4194;
  const posts = await getNearbyPosts(lat, lon);

  posts.forEach((post) => {
    const distanceInMeters = distanceTo(
      { lat, lon },
      {
        lat: post.latitude,
        lon: post.longitude,
      },
    );

    console.log(distanceInMeters);
  });

  console.log(posts);
}

async function getNearbyPosts(
  latitude: number,
  longitude: number,
): Promise<Post[]> {
  // calculate the distance in meters using the Haversine formula
  const distance = 200; // in meters

  const degreesPerMeter = 1 / 111320; // 1 degree is approximately 111320 meters
  const degreesPerDistance = distance * degreesPerMeter;

  const nearbyPosts = await prisma.post.findMany({
    where: {
      latitude: {
        lte: latitude + degreesPerDistance,
        gte: latitude - degreesPerDistance,
      },
      longitude: {
        lte: longitude + degreesPerDistance,
        gte: longitude - degreesPerDistance,
      },
    },
  });

  return nearbyPosts;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

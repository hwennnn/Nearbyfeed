import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Create a new user
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      password: 'testpassword',
      email: 'testuser@example.com',
      posts: {
        create: [
          {
            title: 'My first post',
            content: 'This is the content of my first post.',
            latitude: 37.7749,
            longitude: -122.4194,
          },
          {
            title: 'My second post',
            content: 'This is the content of my second post.',
            latitude: 37.775,
            longitude: -122.4195,
          },
        ],
      },
    },
  });

  console.log(`Created user with id: ${user.id}`);

  // Retrieve all posts and print them
  const posts = await prisma.post.findMany({
    include: {
      author: true,
    },
  });

  console.log(`Retrieved ${posts.length} posts:`);
  console.log(JSON.stringify(posts, null, 2));
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

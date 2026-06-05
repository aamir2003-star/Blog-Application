import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/engineering-blog';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const postSchema = new mongoose.Schema({}, { strict: false });
  const Post = mongoose.model('Post', postSchema, 'posts');

  // Let's find post 'testing' (id 6a16f03e6fce04be419666c8)
  const post = await Post.findById('6a16f03e6fce04be419666c8');
  if (!post) {
    console.error('Post not found');
    await mongoose.disconnect();
    return;
  }

  console.log('Original status:', post.status);
  console.log('Original totalViews:', post.totalViews, 'views:', post.views);

  // Toggle to DRAFT
  post.status = 'DRAFT';
  await post.save();
  console.log('After toggling to DRAFT: totalViews:', post.totalViews, 'views:', post.views);

  // Toggle back to PUBLISHED
  post.status = 'PUBLISHED';
  await post.save();
  console.log('After toggling back to PUBLISHED: totalViews:', post.totalViews, 'views:', post.views);

  await mongoose.disconnect();
}

run().catch(console.error);

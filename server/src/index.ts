import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎓 College Social Network Backend Server        `);
  console.log(`🚀 Live on: http://localhost:${PORT}             `);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

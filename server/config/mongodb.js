import mongoose from 'mongoose'

const connectDB = async () => {

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully')
  })

  let uri = process.env.MONGODB_URI
  // Only append the database name if the URI does not already include one
  const hasDatabase = /\/[^/?#]+[?#]?$/.test(uri.replace(/^mongodb(\+srv)?:\/\/[^/]*/, ''))
  if (!hasDatabase) {
    uri = `${uri}/imagify`
  }

  await mongoose.connect(uri)
}

export default connectDB
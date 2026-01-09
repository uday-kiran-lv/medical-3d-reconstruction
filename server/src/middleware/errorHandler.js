// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Don't log favicon or static asset errors
  const isStaticAsset = req.originalUrl.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|map)$/)
  
  if (!isStaticAsset) {
    console.error('Error:', err.message)
  }
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && !isStaticAsset && { stack: err.stack })
    }
  })
}

// Not found middleware
export const notFound = (req, res, next) => {
  // Silently handle favicon and static asset requests
  if (req.originalUrl.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|map)$/)) {
    return res.status(204).end()
  }
  
  const error = new Error(`Not Found - ${req.originalUrl}`)
  error.status = 404
  next(error)
}

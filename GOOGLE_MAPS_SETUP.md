# Google Maps Integration Guide

## Setting Up Google Maps API for Distance Calculation

### Step 1: Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the following APIs:
   - Distance Matrix API
   - Maps JavaScript API (optional, for future enhancements)
4. Create an API key:
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Restrict the key to only "Distance Matrix API" for security
5. Copy your API key

### Step 2: Add the API Key to Your Environment

1. Open `.env` file in the project root
2. Find the line: `GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"`
3. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key
4. Example:
   ```
   GOOGLE_MAPS_API_KEY="AIzaSyDXm5RCqK-5xJx..."
   ```

### Step 3: Store Location Configuration (Optional)

The store location is currently set to Witbank coordinates:
- Latitude: -25.87
- Longitude: 29.2

To update:
1. Edit `.env`:
   ```
   STORE_LATITUDE="-25.87"
   STORE_LONGITUDE="29.2"
   ```
2. Or in `spring-server/src/main/resources/application.yml`

### Step 4: Restart Your Backend

```bash
# Stop current backend if running
# Run: Run Spring Backend task in VS Code

# The distance calculation will now use real Google Maps data
```

## How It Works

1. **Frontend**: User enters delivery address (street, city, province, postal code)
2. **Backend**: When user clicks "Calculate Delivery Fee":
   - Combines address parts into a full address
   - Calls Google Maps Distance Matrix API
   - Calculates distance from store to customer address
   - Returns distance and fee (R4 per km)
3. **Fallback**: If API key is not set or API call fails:
   - Uses mock distance of 5.5 km
   - Console logs the fallback for debugging

## Testing

1. Add a test product to cart
2. Select "Home delivery" option
3. Enter a delivery address (e.g., "123 Main Street, Johannesburg, Gauteng, 2000")
4. Click "Calculate Delivery Fee"
5. You should see the real distance and calculated fee

## Pricing

- Collection: Free
- Delivery: R4 per kilometer
- Example: 15 km × R4 = R60 delivery fee

## Security Notes

- ⚠️ Never commit `.env` with your API key to git
- ⚠️ Restrict your API key to only needed services in Google Cloud Console
- ⚠️ Monitor your API usage to avoid unexpected charges
- The key is server-side only and never exposed to frontend

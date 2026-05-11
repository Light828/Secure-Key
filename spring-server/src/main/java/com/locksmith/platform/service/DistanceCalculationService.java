package com.locksmith.platform.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DistanceCalculationService {

    private static final Logger logger = LoggerFactory.getLogger(DistanceCalculationService.class);
    private static final String GOOGLE_MAPS_DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";

    @Value("${google.maps.api-key:}")
    private String googleMapsApiKey;

    @Value("${store.latitude:-25.87}")
    private String storeLatitude;

    @Value("${store.longitude:29.2}")
    private String storeLongitude;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public DistanceCalculationService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Calculate distance in kilometers from store to delivery address using
     * Google Maps API Falls back to mock distance if API key is not configured
     * or API call fails
     *
     * @param address Full delivery address (street, city, province, postal
     * code)
     * @return distance in kilometers
     */
    public double calculateDistance(String address) {
        // If no API key configured, use mock distance
        if (googleMapsApiKey == null || googleMapsApiKey.isEmpty() || googleMapsApiKey.contains("YOUR_")) {
            logger.warn("Google Maps API key not configured. Using mock distance calculation.");
            return 5.5; // Mock distance in km
        }

        try {
            // Build origin (store location)
            String origin = storeLatitude + "," + storeLongitude;

            // Build destination (customer address)
            String destination = URLEncoder.encode(address, StandardCharsets.UTF_8);

            // Build the API request URL
            String url = UriComponentsBuilder.fromHttpUrl(GOOGLE_MAPS_DISTANCE_MATRIX_URL)
                    .queryParam("origins", origin)
                    .queryParam("destinations", destination)
                    .queryParam("key", googleMapsApiKey)
                    .queryParam("units", "metric")
                    .toUriString();

            // Make the API call
            String response = restTemplate.getForObject(url, String.class);

            // Parse the response
            JsonNode root = objectMapper.readTree(response);

            // Extract distance
            String status = root.path("status").asText();
            if ("OK".equals(status)) {
                JsonNode rows = root.path("rows");
                if (rows.isArray() && rows.size() > 0) {
                    JsonNode elements = rows.get(0).path("elements");
                    if (elements.isArray() && elements.size() > 0) {
                        JsonNode element = elements.get(0);
                        String elementStatus = element.path("status").asText();

                        if ("OK".equals(elementStatus)) {
                            long distanceMeters = element.path("distance").path("value").asLong();
                            double distanceKm = distanceMeters / 1000.0;
                            logger.info("Calculated distance: {} km", distanceKm);
                            return distanceKm;
                        }
                    }
                }
            }

            logger.warn("Google Maps API returned status: {}. Using mock distance.", status);
        } catch (Exception e) {
            logger.error("Error calling Google Maps API: {}", e.getMessage(), e);
        }

        // Fallback to mock distance
        return 5.5;
    }
}

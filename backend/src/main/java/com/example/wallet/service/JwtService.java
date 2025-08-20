package com.example.wallet.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    @Value("${jwt.secret:dev-secret-please-change}")
    private String secret;
    @Value("${jwt.expirationMillis:3600000}")
    private long expirationMillis;

    private volatile Key cachedKey;

    private Key key() {
        if (cachedKey == null) {
            synchronized (this) {
                if (cachedKey == null) {
                    byte[] keyBytes;
                    // Heuristic: if it looks like Base64 (and decodes), treat as base64, else raw UTF-8
                    try {
                        keyBytes = Decoders.BASE64.decode(secret);
                    } catch (IllegalArgumentException ex) {
                        keyBytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    }
                    if (keyBytes.length < 32) { // 256 bits
                        throw new IllegalStateException("JWT secret too short (" + (keyBytes.length * 8) + " bits). Provide at least 256-bit secret (32 bytes). Generate one, e.g.: 'openssl rand -base64 48'.");
                    }
                    cachedKey = Keys.hmacShaKeyFor(keyBytes);
                }
            }
        }
        return cachedKey;
    }

    public String generate(String subject, Map<String, Object> claims) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}

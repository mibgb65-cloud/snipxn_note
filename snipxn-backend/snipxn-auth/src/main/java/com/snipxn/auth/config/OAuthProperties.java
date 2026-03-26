package com.snipxn.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "snipxn.oauth")
public class OAuthProperties {

    private Provider github = new Provider();
    private Provider google = new Provider();

    @Data
    public static class Provider {
        private String clientId = "";
        private String clientSecret = "";
    }
}

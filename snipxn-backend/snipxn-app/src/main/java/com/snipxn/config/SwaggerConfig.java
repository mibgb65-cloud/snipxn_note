package com.snipxn.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        String schemeName = "Bearer Token";
        return new OpenAPI()
                .info(new Info()
                        .title("Snipxn API")
                        .description("""
                                Snipxn 代码笔记系统后端接口文档。
                                所有接口统一返回 Result<T> 结构：code 表示业务状态码，message 表示结果说明，data 表示业务数据。
                                需要登录的接口请先点击 Authorize，并填入 JWT Access Token。
                                """)
                        .version("v1"))
                .components(new Components()
                        .addSecuritySchemes(schemeName, new SecurityScheme()
                                .name(schemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}

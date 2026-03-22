package com.snipxn;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.snipxn.**.mapper")
public class SnipxnApplication {
    public static void main(String[] args) {
        SpringApplication.run(SnipxnApplication.class, args);
    }
}

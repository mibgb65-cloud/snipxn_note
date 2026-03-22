package com.snipxn.config;

import org.springframework.amqp.core.AcknowledgeMode;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.amqp.autoconfigure.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EMAIL_EXCHANGE = "snipxn.email.exchange";
    public static final String EMAIL_QUEUE = "snipxn.email.queue";
    public static final String EMAIL_ROUTING_KEY = "email.send";
    public static final String EMAIL_RETRY_EXCHANGE = "snipxn.email.retry.exchange";
    public static final String EMAIL_RETRY_QUEUE = "snipxn.email.retry.queue";
    public static final String EMAIL_RETRY_ROUTING_KEY = "email.send.retry";
    public static final String EMAIL_DLX_EXCHANGE = "snipxn.email.dlx";
    public static final String EMAIL_DLQ = "snipxn.email.dlq";
    public static final String EMAIL_DLQ_ROUTING_KEY = "email.send.dlq";
    public static final String VIEW_EXCHANGE = "snipxn.community.exchange";
    public static final String VIEW_QUEUE = "snipxn.community.view.queue";
    public static final String VIEW_ROUTING_KEY = "view.count";

    @Bean
    public DirectExchange emailExchange(
            @Value("${snipxn.mq.email-exchange:" + EMAIL_EXCHANGE + "}") String exchangeName
    ) {
        return ExchangeBuilder.directExchange(exchangeName).durable(true).build();
    }

    @Bean
    public DirectExchange emailRetryExchange(
            @Value("${snipxn.mq.email-retry-exchange:" + EMAIL_RETRY_EXCHANGE + "}") String exchangeName
    ) {
        return ExchangeBuilder.directExchange(exchangeName).durable(true).build();
    }

    @Bean
    public DirectExchange emailDlxExchange(
            @Value("${snipxn.mq.email-dlx-exchange:" + EMAIL_DLX_EXCHANGE + "}") String exchangeName
    ) {
        return ExchangeBuilder.directExchange(exchangeName).durable(true).build();
    }

    @Bean
    public Queue emailQueue(
            @Value("${snipxn.mq.email-queue:" + EMAIL_QUEUE + "}") String queueName,
            @Value("${snipxn.mq.email-dlx-exchange:" + EMAIL_DLX_EXCHANGE + "}") String dlxExchange,
            @Value("${snipxn.mq.email-dlq-routing-key:" + EMAIL_DLQ_ROUTING_KEY + "}") String dlqRoutingKey
    ) {
        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", dlxExchange)
                .withArgument("x-dead-letter-routing-key", dlqRoutingKey)
                .build();
    }

    @Bean
    public Queue emailRetryQueue(
            @Value("${snipxn.mq.email-retry-queue:" + EMAIL_RETRY_QUEUE + "}") String queueName,
            @Value("${snipxn.mq.email-exchange:" + EMAIL_EXCHANGE + "}") String emailExchange,
            @Value("${snipxn.mq.email-routing-key:" + EMAIL_ROUTING_KEY + "}") String emailRoutingKey,
            @Value("${snipxn.mq.email-retry-delay-ms:30000}") long retryDelayMs
    ) {
        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", emailExchange)
                .withArgument("x-dead-letter-routing-key", emailRoutingKey)
                .withArgument("x-message-ttl", retryDelayMs)
                .build();
    }

    @Bean
    public Queue emailDlq(
            @Value("${snipxn.mq.email-dlq:" + EMAIL_DLQ + "}") String queueName
    ) {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Binding emailBinding(
            @Qualifier("emailExchange") DirectExchange emailExchange,
            @Qualifier("emailQueue") Queue emailQueue,
            @Value("${snipxn.mq.email-routing-key:" + EMAIL_ROUTING_KEY + "}") String routingKey
    ) {
        return BindingBuilder.bind(emailQueue).to(emailExchange).with(routingKey);
    }

    @Bean
    public Binding emailRetryBinding(
            @Qualifier("emailRetryExchange") DirectExchange emailRetryExchange,
            @Qualifier("emailRetryQueue") Queue emailRetryQueue,
            @Value("${snipxn.mq.email-retry-routing-key:" + EMAIL_RETRY_ROUTING_KEY + "}") String routingKey
    ) {
        return BindingBuilder.bind(emailRetryQueue).to(emailRetryExchange).with(routingKey);
    }

    @Bean
    public Binding emailDlqBinding(
            @Qualifier("emailDlxExchange") DirectExchange emailDlxExchange,
            @Qualifier("emailDlq") Queue emailDlq,
            @Value("${snipxn.mq.email-dlq-routing-key:" + EMAIL_DLQ_ROUTING_KEY + "}") String routingKey
    ) {
        return BindingBuilder.bind(emailDlq).to(emailDlxExchange).with(routingKey);
    }

    @Bean
    public DirectExchange viewExchange() {
        return ExchangeBuilder.directExchange(VIEW_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue viewQueue() {
        return QueueBuilder.durable(VIEW_QUEUE).build();
    }

    @Bean
    public Binding viewBinding(
            @Qualifier("viewExchange") DirectExchange viewExchange,
            @Qualifier("viewQueue") Queue viewQueue
    ) {
        return BindingBuilder.bind(viewQueue).to(viewExchange).with(VIEW_ROUTING_KEY);
    }

    /** 使用 JSON 序列化消息体，避免 Java 序列化兼容性问题 */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         Jackson2JsonMessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory manualAckRabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter messageConverter
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setMessageConverter(messageConverter);
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }
}

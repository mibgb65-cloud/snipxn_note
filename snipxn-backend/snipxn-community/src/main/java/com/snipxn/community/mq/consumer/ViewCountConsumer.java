package com.snipxn.community.mq.consumer;

import com.snipxn.community.mapper.PostMapper;
import com.snipxn.community.mq.message.ViewCountMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ViewCountConsumer {

    private final PostMapper postMapper;

    @RabbitListener(queues = "snipxn.community.view.queue")
    public void handleViewCount(ViewCountMessage message) {
        String postId = message.getPostId();
        postMapper.incrementViewCount(postId);
        log.debug("浏览量更新: postId={}", postId);
    }
}

package com.snipxn.note.listener;

import com.snipxn.common.event.UserRegisteredEvent;
import com.snipxn.note.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class UserRegisteredListener {

    private final FolderService folderService;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onUserRegistered(UserRegisteredEvent event) {
        folderService.initDefaultFolder(event.getUserId());
    }
}

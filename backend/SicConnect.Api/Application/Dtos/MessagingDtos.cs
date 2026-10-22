namespace SicConnect.Api.Application.Dtos;

/// <summary>A conversation summary for the messaging inbox (one per counterpart).</summary>
public record ConversationDto(
    int OtherUserId,
    string OtherName,
    string? OtherHeadline,
    string? LastMessage,
    DateTime? LastAt,
    int UnreadCount,
    bool IsConnected);

/// <summary>A single message within a thread.</summary>
public record MessageDto(
    int Id,
    int SenderId,
    bool IsMine,
    string Body,
    DateTime SentAt,
    DateTime? ReadAt);

/// <summary>The full thread with one counterpart, plus that person's display details.</summary>
public record ThreadDto(
    int OtherUserId,
    string OtherName,
    string? OtherHeadline,
    bool IsConnected,
    IReadOnlyList<MessageDto> Messages);

/// <summary>Payload to send a message.</summary>
public record SendMessageDto(string Body);

using SicConnect.Api.Application.Dtos;

namespace SicConnect.Api.Application.Interfaces;

public interface IAuthService
{
    Task<RegistrationResultDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
}

public interface IProfileService
{
    Task<ProfileDto> GetMineAsync(CancellationToken ct = default);
    Task<ProfileDto> UpdateMineAsync(UpdateProfileDto dto, CancellationToken ct = default);
}

public interface IDirectoryService
{
    Task<PagedResult<DirectoryItemDto>> SearchAsync(DirectoryQueryDto query, CancellationToken ct = default);
}

public interface ILeaderboardService
{
    /// <summary>Ranked recognition leaderboard. <paramref name="board"/> is "alumni" or "mentor".</summary>
    Task<LeaderboardResultDto> GetAsync(string board, int top, CancellationToken ct = default);
}

public interface ICvService
{
    /// <summary>Store an uploaded PDF as the current user's CV; updates the profile's CvUrl.</summary>
    Task<CvResultDto> UploadAsync(Microsoft.AspNetCore.Http.IFormFile? file, CancellationToken ct = default);

    /// <summary>Remove the current user's uploaded CV.</summary>
    Task<CvResultDto> DeleteAsync(CancellationToken ct = default);

    /// <summary>Resolve a stored CV file name to a physical path, or null if missing/invalid.</summary>
    string? ResolvePhysicalPath(string fileName);
}

public interface IContactService
{
    /// <summary>Submit a public contact message; delivered to administrators via notifications.</summary>
    Task<ContactResultDto> SubmitAsync(ContactMessageDto dto, CancellationToken ct = default);
}

public interface IMentorService
{
    /// <summary>Whether the current alumnus qualifies to apply to become a mentor, and progress toward it.</summary>
    Task<MentorEligibilityDto> GetEligibilityAsync(CancellationToken ct = default);

    /// <summary>Submit a mentor application: validates eligibility and notifies administrators to review.</summary>
    Task<MentorApplyResultDto> ApplyAsync(CancellationToken ct = default);
}

public interface IOpportunityService
{
    Task<IReadOnlyList<OpportunityDto>> ListAsync(CancellationToken ct = default);
    Task<OpportunityDto> GetAsync(int id, CancellationToken ct = default);
    Task<OpportunityDto> CreateAsync(CreateOpportunityDto dto, CancellationToken ct = default);
    Task<OpportunityDto> UpdateAsync(int id, CreateOpportunityDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IEventService
{
    Task<IReadOnlyList<EventDto>> ListAsync(CancellationToken ct = default);
    Task<EventDto> GetAsync(int id, CancellationToken ct = default);
    Task<EventDto> CreateAsync(CreateEventDto dto, CancellationToken ct = default);
    Task<EventDto> UpdateAsync(int id, CreateEventDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<EventAttendeeDto>> ListAttendeesAsync(int eventId, CancellationToken ct = default);
    Task RegisterAsync(int eventId, CancellationToken ct = default);
    Task UnregisterAsync(int eventId, CancellationToken ct = default);
}

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDto>> ListMineAsync(CancellationToken ct = default);
    Task<ProjectDto> CreateAsync(CreateProjectDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IAnnouncementService
{
    Task<IReadOnlyList<AnnouncementDto>> ListAsync(CancellationToken ct = default);
    Task<AnnouncementDto> CreateAsync(CreateAnnouncementDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IAdminService
{
    Task<IReadOnlyList<AdminUserDto>> ListUsersAsync(CancellationToken ct = default);
    Task<AdminUserDto> UpdateRoleAsync(int userId, UpdateUserRoleDto dto, CancellationToken ct = default);
    Task DeleteUserAsync(int userId, CancellationToken ct = default);

    /// <summary>All mentorship requests/relationships across the platform (admin oversight, read-only).</summary>
    Task<IReadOnlyList<AdminMentorshipDto>> ListMentorshipsAsync(CancellationToken ct = default);

    // ----- Account approval workflow -----
    Task<IReadOnlyList<AccountApprovalDto>> ListPendingApprovalsAsync(CancellationToken ct = default);
    Task<AccountApprovalDto> ApproveAsync(int userId, CancellationToken ct = default);
    Task<AccountApprovalDto> RejectAsync(int userId, ReviewAccountDto dto, CancellationToken ct = default);
    Task<AccountApprovalDto> RequestInfoAsync(int userId, ReviewAccountDto dto, CancellationToken ct = default);
}

public interface IAnalyticsService
{
    Task<AnalyticsSummaryDto> GetSummaryAsync(CancellationToken ct = default);

    /// <summary>Comprehensive administrator dashboard data, aggregated read-only from existing tables.</summary>
    Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct = default);
}

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> ListMineAsync(CancellationToken ct = default);
    Task<int> UnreadCountAsync(CancellationToken ct = default);
    Task MarkReadAsync(int id, CancellationToken ct = default);
    Task MarkAllReadAsync(CancellationToken ct = default);

    /// <summary>Creates an in-app notification for a user. Used by other services; never throws to the caller.</summary>
    Task NotifyAsync(int userId, string message, string? link = null, CancellationToken ct = default);
}

public interface INetworkingService
{
    Task<IReadOnlyList<ConnectionDto>> ListMineAsync(CancellationToken ct = default);
    Task<ConnectionDto> RequestAsync(CreateConnectionDto dto, CancellationToken ct = default);
    Task<ConnectionDto> RespondAsync(int connectionId, RespondConnectionDto dto, CancellationToken ct = default);
    Task RemoveAsync(int connectionId, CancellationToken ct = default);

    /// <summary>AI networking suggestions (prototype heuristic): people the caller may want to connect with.</summary>
    Task<IReadOnlyList<PersonSuggestionDto>> SuggestAsync(int take = 8, CancellationToken ct = default);
}

public interface IApplicationService
{
    Task<ApplicationDto> ApplyAsync(int opportunityId, CreateApplicationDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<ApplicationDto>> ListMineAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ApplicationDto>> ListForOpportunityAsync(int opportunityId, CancellationToken ct = default);
    Task<ApplicationDto> UpdateStatusAsync(int applicationId, UpdateApplicationStatusDto dto, CancellationToken ct = default);
    Task WithdrawAsync(int applicationId, CancellationToken ct = default);
}

public interface IRecommendationService
{
    /// <summary>AI-powered opportunity recommendations (prototype heuristic) for the caller.</summary>
    Task<IReadOnlyList<OpportunityRecommendationDto>> RecommendOpportunitiesAsync(int take = 6, CancellationToken ct = default);
}

public interface IMessageService
{
    Task<IReadOnlyList<ConversationDto>> GetConversationsAsync(CancellationToken ct = default);
    Task<ThreadDto> GetThreadAsync(int otherUserId, CancellationToken ct = default);
    Task<MessageDto> SendAsync(int otherUserId, SendMessageDto dto, CancellationToken ct = default);
    Task<int> UnreadCountAsync(CancellationToken ct = default);
}

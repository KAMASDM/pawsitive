import React from 'react';
import { Box, Card, CardContent, Container, Grid, Paper, Skeleton } from '@mui/material';
import { alpha, keyframes } from '@mui/system';
import { useTheme } from '@mui/material/styles';

// Create shimmer animation keyframes
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const MeetingDetailsSkeleton = ({ activeTab = 0 }) => {
    const theme = useTheme();

    // Shimmer overlay styling
    const shimmerOverlay = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        animation: `${shimmer} 1.5s infinite linear`,
        background: `linear-gradient(90deg, 
      ${alpha(theme.palette.background.paper, 0)} 0%, 
      ${alpha(theme.palette.background.paper, 0.6)} 50%, 
      ${alpha(theme.palette.background.paper, 0)} 100%)`,
        backgroundSize: '200px 100%',
        zIndex: 1,
    };

    // Header Skeleton
    const HeaderSkeleton = () => (
        <Box sx={{ mb: 4 }}>
            <Skeleton width={100} height={28} sx={{ mb: 2 }} />
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 },
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="text" width={220} height={40} sx={{ mr: 1 }} />
                        <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        <Skeleton variant="rounded" width={120} height={24} />
                        <Skeleton variant="rounded" width={100} height={24} />
                        <Skeleton variant="rounded" width={150} height={24} />
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rounded" width={80} height={36} />
                    <Skeleton variant="rounded" width={80} height={36} />
                    <Skeleton variant="circular" width={36} height={36} />
                </Box>
            </Box>
        </Box>
    );

    // Tabs Skeleton
    const TabsSkeleton = () => (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Box sx={{ display: 'flex' }}>
                <Skeleton variant="rounded" width={120} height={48} sx={{ mr: 2 }} />
                <Skeleton variant="rounded" width={120} height={48} sx={{ mr: 2 }} />
                <Skeleton variant="rounded" width={120} height={48} sx={{ mr: 2 }} />
                <Skeleton variant="rounded" width={120} height={48} />
            </Box>
        </Box>
    );

    // Minutes Tab Skeleton
    const MinutesTabSkeleton = () => (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 4 }}>
                {/* Overview Section */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
                        <Skeleton width={180} height={28} />
                    </Box>
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.1),
                            mb: 4,
                            position: 'relative',
                        }}
                    >
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Skeleton width={100} height={20} sx={{ mb: 1 }} />
                                <Skeleton width={150} height={24} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Skeleton width={100} height={20} sx={{ mb: 1 }} />
                                <Skeleton width={180} height={24} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Skeleton width={100} height={20} sx={{ mb: 1 }} />
                                <Skeleton width={160} height={24} />
                            </Grid>
                        </Grid>
                        <Box sx={shimmerOverlay} />
                    </Box>
                    <Box sx={{ mb: 4 }}>
                        <Skeleton width={100} height={28} sx={{ mb: 2 }} />
                        <Skeleton width="100%" height={20} sx={{ mb: 1 }} />
                        <Skeleton width="90%" height={20} sx={{ mb: 1 }} />
                        <Skeleton width="95%" height={20} sx={{ mb: 1 }} />
                    </Box>
                </Box>

                {/* Key Points Section */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
                        <Skeleton width={220} height={28} />
                    </Box>
                    <Skeleton width="100%" height={20} sx={{ mb: 1 }} />
                    <Skeleton width="95%" height={20} sx={{ mb: 1 }} />
                    <Skeleton width="90%" height={20} sx={{ mb: 1 }} />
                    <Skeleton width="97%" height={20} sx={{ mb: 1 }} />
                </Box>

                {/* Decisions Section */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
                        <Skeleton width={160} height={28} />
                    </Box>
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            border: '1px solid',
                            borderColor: alpha(theme.palette.warning.main, 0.1),
                            mb: 3,
                            position: 'relative',
                        }}
                    >
                        {[1, 2, 3].map((_, index) => (
                            <Box key={index} sx={{ display: 'flex', mb: 2, '&:last-child': { mb: 0 } }}>
                                <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2, flexShrink: 0 }} />
                                <Skeleton width="90%" height={20} />
                            </Box>
                        ))}
                        <Box sx={shimmerOverlay} />
                    </Box>
                </Box>

                {/* Action Items Section */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
                        <Skeleton width={140} height={28} />
                    </Box>
                    <Box
                        sx={{
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            overflow: 'hidden',
                            mb: 3,
                            position: 'relative',
                        }}
                    >
                        {[1, 2, 3].map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderBottom: index < 2 ? '1px solid' : 'none',
                                    borderColor: theme.palette.divider,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Skeleton variant="circular" width={32} height={32} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Skeleton width="80%" height={20} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <Skeleton width={120} height={16} />
                                        <Box sx={{ mx: 1, height: 16, width: 1 }} />
                                        <Skeleton width={80} height={16} />
                                    </Box>
                                </Box>
                                <Skeleton variant="rounded" width={80} height={24} />
                            </Box>
                        ))}
                        <Box sx={shimmerOverlay} />
                    </Box>
                </Box>
            </CardContent>
            <Box sx={shimmerOverlay} />
        </Card>
    );

    // Transcript Tab Skeleton
    const TranscriptTabSkeleton = () => (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 4,
                    }}
                >
                    <Skeleton width={150} height={32} />
                    <Skeleton variant="rounded" width={120} height={36} />
                </Box>
                <Box
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        height: '60vh',
                        position: 'relative',
                    }}
                >
                    {[...Array(15)].map((_, index) => (
                        <React.Fragment key={index}>
                            <Skeleton width="100%" height={20} sx={{ mb: 1 }} />
                            <Skeleton width="95%" height={20} sx={{ mb: 1 }} />
                            <Skeleton width="90%" height={20} sx={{ mb: 2 }} />
                        </React.Fragment>
                    ))}
                    <Box sx={shimmerOverlay} />
                </Box>
            </CardContent>
            <Box sx={shimmerOverlay} />
        </Card>
    );

    // Action Items Tab Skeleton
    const ActionItemsTabSkeleton = () => (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 4,
                    }}
                >
                    <Skeleton width={200} height={32} />
                    <Skeleton variant="rounded" width={120} height={36} />
                </Box>
                <Box sx={{ ml: 2 }}>
                    {[...Array(4)].map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 4 }}>
                            <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Skeleton variant="circular" width={16} height={16} />
                                <Skeleton width={2} height={80} sx={{ my: 1 }} />
                            </Box>
                            <Box sx={{ width: '100%' }}>
                                <Skeleton width={80} height={20} sx={{ mb: 1 }} />
                                <Paper
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'background.paper',
                                        width: '100%',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Skeleton width="90%" height={20} sx={{ mb: 1 }} />
                                    <Skeleton width="60%" height={16} />
                                    <Box sx={shimmerOverlay} />
                                </Paper>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </CardContent>
            <Box sx={shimmerOverlay} />
        </Card>
    );

    // Recording Tab Skeleton
    const RecordingTabSkeleton = () => (
        <Card
            sx={{
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <Skeleton width={200} height={32} sx={{ mb: 4 }} />
                <Box
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        bgcolor: 'background.paper',
                        position: 'relative',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                            <Skeleton width={100} height={20} />
                        </Box>
                        <Skeleton width={60} height={20} />
                    </Box>
                    <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton width={60} height={20} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Skeleton variant="circular" width={36} height={36} />
                            <Skeleton variant="circular" width={36} height={36} />
                            <Skeleton variant="circular" width={36} height={36} />
                        </Box>
                        <Skeleton width={60} height={20} />
                    </Box>
                    <Box sx={shimmerOverlay} />
                </Box>
            </CardContent>
            <Box sx={shimmerOverlay} />
        </Card>
    );

    // Render the appropriate tab content based on activeTab
    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return <MinutesTabSkeleton />;
            case 1:
                return <TranscriptTabSkeleton />;
            case 2:
                return <ActionItemsTabSkeleton />;
            case 3:
                return <RecordingTabSkeleton />;
            default:
                return <MinutesTabSkeleton />;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 3 }}>
            <HeaderSkeleton />
            <TabsSkeleton />
            {renderTabContent()}
        </Container>
    );
};

export default MeetingDetailsSkeleton;
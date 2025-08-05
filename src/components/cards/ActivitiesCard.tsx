import { Activity } from "@/lib/store/activitiesStore";
import Link from "next/link";
import Image from "next/image";
import { Clock, Users, ImageIcon } from "lucide-react";
import { QuickStats } from "@/components/reviews";
import { useReviewStats } from "@/lib/hooks/useReviews";

export default function ActivitiesCard({activity}: {activity: Activity}) {
    // Get real review stats
    const { data: reviewStats, isLoading: isLoadingReviewStats } = useReviewStats({
      assetId: activity.id,
      assetType: 'activity'
    });
    
    return (
        <div className="group overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 rounded-xl flex flex-col h-full w-full bg-white">
            <Link href={`/atividades/${activity.id}`} className="flex flex-col h-full w-full">
                {/* Imagem principal - sem padding no topo */}
                <div className="relative aspect-4/3 overflow-hidden rounded-t-xl">
                    {activity.imageUrl && activity.imageUrl.trim() !== '' ? (
                        <Image  
                            src={activity.imageUrl} 
                            alt={activity.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                    {/* Badge de preço */}
                    <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
                        $ {activity.price?.toFixed(2) || '0.00'}
                    </div>
                    {/* Badge de categoria */}
                    <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
                        {activity.category || 'Categoria'}
                    </div>
                </div>
                
                {/* Conteúdo do card */}
                <div className="flex flex-col grow p-5">
                    {/* Título e avaliação */}
                    <div className="mb-2 flex justify-between items-start">
                        <h3 className="text-lg font-medium line-clamp-1">{activity.title || 'Título da Atividade'}</h3>
                        
                        {/* Review Stats - com fallback para dados estáticos */}
                        {(() => {
                            // Get rating from reviews system or fallback to activity static data
                            const hasReviewData = !isLoadingReviewStats && reviewStats?.averageRating && reviewStats.averageRating > 0;
                            const finalRating = hasReviewData ? reviewStats.averageRating : (activity.rating || 0);
                            const finalReviews = hasReviewData ? reviewStats.totalReviews : undefined;
                            
                            // Ensure rating is valid
                            const validRating = typeof finalRating === 'number' && !isNaN(finalRating) && isFinite(finalRating) ? finalRating : 0;
                            const validReviews = typeof finalReviews === 'number' && !isNaN(finalReviews) && isFinite(finalReviews) ? finalReviews : undefined;
                            
                            return (
                                <QuickStats
                                    averageRating={validRating}
                                    totalReviews={validReviews}
                                    recommendationPercentage={!isLoadingReviewStats && reviewStats?.recommendationPercentage ? reviewStats.recommendationPercentage : undefined}
                                    className="text-sm"
                                />
                            );
                        })()}
                        {/* Debug logging */}
                        {console.log("🎯 ActivitiesCard Debug:", {
                            activityId: activity.id,
                            activityRating: activity.rating,
                            isLoadingReviewStats,
                            reviewStats,
                            finalRating: !isLoadingReviewStats && reviewStats?.averageRating ? reviewStats.averageRating : (activity.rating || 0),
                            finalTotalReviews: !isLoadingReviewStats && reviewStats?.totalReviews ? reviewStats.totalReviews : undefined
                        })}
                    </div>
                    
                    {/* Descrição curta */}
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {activity.shortDescription || 'Descrição não disponível'}
                    </p>
                    
                    {/* Informações adicionais */}
                    <div className="mt-auto space-y-2">
                        <div className="flex gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{activity.duration || 'Duração não informada'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>Até {activity.maxParticipants || 0}</span>
                            </div>
                        </div>
                        
                        {/* CTA */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Aproveite!</span>
                            <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:underline transition-colors">
                                Ver detalhes →
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}
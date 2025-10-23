import { getSettings } from '@/lib/settings';
import CommentSection from '@/components/comments/comment-section';

export const dynamic = 'force-dynamic';

export default async function DebugSettings() {
  const settings = await getSettings();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">🔍 Debug Settings & Comment Form</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-8">
        <h2 className="font-bold mb-2">Current Settings:</h2>
        <ul className="space-y-1">
          <li><strong>enableComments:</strong> {settings.enableComments ? '✅ TRUE' : '❌ FALSE'}</li>
          <li><strong>allowGuestComments:</strong> {settings.allowGuestComments ? '✅ TRUE' : '❌ FALSE'}</li>
          <li><strong>moderateComments:</strong> {settings.moderateComments ? '✅ TRUE' : '❌ FALSE'}</li>
        </ul>
        
        <h2 className="font-bold mb-2 mt-4">Form Should Show:</h2>
        <p className="text-lg">
          {settings.enableComments ? (
            <span className="text-green-600 font-bold">✅ YES - Form should be visible</span>
          ) : (
            <span className="text-red-600 font-bold">❌ NO - Form should be hidden</span>
          )}
        </p>
      </div>
      
      <div className="border-2 border-dashed border-blue-300 p-4 rounded">
        <h2 className="font-bold mb-4">🧪 Test Comment Section:</h2>
        <CommentSection articleId="test-article" />
        {!settings.enableComments && (
          <p className="text-red-600 font-bold">👆 Comment section should be completely hidden above</p>
        )}
      </div>
    </div>
  );
}

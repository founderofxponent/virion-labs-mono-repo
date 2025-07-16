import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Copy, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscordSyncSectionProps {
  onNext: () => void;
  onBack: () => void;
  formData: any;
  updateFormData: (data: any) => void;
}

const DiscordSyncSection: React.FC<DiscordSyncSectionProps> = ({
  onNext,
  onBack,
  formData,
  updateFormData
}) => {
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = React.useState<'pending' | 'syncing' | 'completed' | 'error'>('pending');
  const [syncedData, setSyncedData] = React.useState<any>(null);

  // Mock bot invite URL - in real implementation, this would be generated
  const botInviteUrl = `https://discord.com/api/oauth2/authorize?client_id=123456789&permissions=8&scope=bot%20applications.commands&guild_id=`;

  const copyInviteUrl = () => {
    navigator.clipboard.writeText(botInviteUrl);
    toast({
      title: "Copied!",
      description: "Bot invite URL copied to clipboard",
    });
  };

  const handleSyncComplete = () => {
    setSyncStatus('syncing');
    
    // Mock sync process
    setTimeout(() => {
      const mockSyncedData = {
        guilds: [
          {
            id: '123456789012345678',
            name: 'My Gaming Community',
            icon: null,
            channels: [
              { id: '111111111111111111', name: 'general', type: 0 },
              { id: '222222222222222222', name: 'announcements', type: 0 },
              { id: '333333333333333333', name: 'campaigns', type: 0 },
            ],
            roles: [
              { id: '444444444444444444', name: '@everyone', color: 0 },
              { id: '555555555555555555', name: 'Verified', color: 5763719 },
              { id: '666666666666666666', name: 'VIP', color: 15844367 },
              { id: '777777777777777777', name: 'Moderator', color: 3447003 },
            ]
          }
        ]
      };
      
      setSyncedData(mockSyncedData);
      setSyncStatus('completed');
      updateFormData({ syncedDiscordData: mockSyncedData });
      
      toast({
        title: "Discord Sync Complete!",
        description: "Successfully synced your Discord server data",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Connect Your Discord Server</h3>
        <p className="text-muted-foreground mt-1">
          Add our bot to your Discord server and sync your server configuration
        </p>
      </div>

      {/* Step 1: Add Bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Step 1: Add Bot to Your Server
          </CardTitle>
          <CardDescription>
            Click the button below to invite our bot to your Discord server with the necessary permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => window.open(botInviteUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Invite Bot to Discord
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteUrl}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Invite URL
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure to grant the bot Administrator permissions or at least Manage Channels, Manage Roles, and Send Messages permissions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 2: Run Sync Command */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {syncStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : syncStatus === 'syncing' ? (
                <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              Step 2: Sync Server Data
            </div>
          </CardTitle>
          <CardDescription>
            Run the sync command in your Discord server to collect channel and role information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Run this command in any channel:</p>
            <code className="bg-background px-2 py-1 rounded text-sm">/sync-server</code>
          </div>

          {syncStatus === 'pending' && (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After adding the bot to your server, run the <code>/sync-server</code> command in any channel. 
                  The bot will collect your server's channels and roles and send them to this dashboard.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleSyncComplete}
                variant="outline"
                className="w-full"
              >
                I've run the sync command
              </Button>
            </div>
          )}

          {syncStatus === 'syncing' && (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Syncing server data...</p>
            </div>
          )}

          {syncStatus === 'completed' && syncedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Sync completed successfully!</span>
              </div>
              
              {syncedData.guilds.map((guild: any) => (
                <div key={guild.id} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">{guild.name}</h4>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Channels ({guild.channels.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {guild.channels.slice(0, 5).map((channel: any) => (
                        <Badge key={channel.id} variant="secondary" className="text-xs">
                          #{channel.name}
                        </Badge>
                      ))}
                      {guild.channels.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{guild.channels.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Roles ({guild.roles.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {guild.roles.slice(0, 5).map((role: any) => (
                        <Badge key={role.id} variant="secondary" className="text-xs">
                          {role.name}
                        </Badge>
                      ))}
                      {guild.roles.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{guild.roles.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={syncStatus !== 'completed'}
        >
          Continue to Campaign Setup
        </Button>
      </div>
    </div>
  );
};

export default DiscordSyncSection;
import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiCampaignInfluencerAccessCampaignInfluencerAccess
  extends Struct.CollectionTypeSchema {
  collectionName: 'campaign_influencer_accesses';
  info: {
    displayName: 'Campaign Influencer Access';
    pluralName: 'campaign-influencer-accesses';
    singularName: 'campaign-influencer-access';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    access_granted_at: Schema.Attribute.DateTime;
    admin_response: Schema.Attribute.RichText;
    campaign: Schema.Attribute.Relation<'manyToOne', 'api::campaign.campaign'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-influencer-access.campaign-influencer-access'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    request_message: Schema.Attribute.RichText;
    request_status: Schema.Attribute.Enumeration<
      ['pending', 'approved', 'denied']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    requested_at: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiCampaignLandingPageCampaignLandingPage
  extends Struct.CollectionTypeSchema {
  collectionName: 'campaign_landing_pages';
  info: {
    displayName: 'Campaign Landing Page';
    pluralName: 'campaign-landing-pages';
    singularName: 'campaign-landing-page';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaign: Schema.Attribute.Relation<'oneToOne', 'api::campaign.campaign'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    hero_image_url: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    how_it_works: Schema.Attribute.RichText;
    inherited_from_template: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    landing_page_template: Schema.Attribute.Relation<
      'oneToOne',
      'api::landing-page-template.landing-page-template'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-landing-page.campaign-landing-page'
    > &
      Schema.Attribute.Private;
    offer_description: Schema.Attribute.RichText;
    offer_expiry_date: Schema.Attribute.DateTime;
    offer_highlights: Schema.Attribute.JSON;
    offer_title: Schema.Attribute.String;
    offer_value: Schema.Attribute.String;
    product_images: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    requirements: Schema.Attribute.RichText;
    support_info: Schema.Attribute.RichText;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    video_url: Schema.Attribute.String;
    what_you_get: Schema.Attribute.RichText;
  };
}

export interface ApiCampaignOnboardingCompletionCampaignOnboardingCompletion
  extends Struct.CollectionTypeSchema {
  collectionName: 'campaign_onboarding_completions';
  info: {
    displayName: 'Campaign Onboarding Completion';
    pluralName: 'campaign-onboarding-completions';
    singularName: 'campaign-onboarding-completion';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaign: Schema.Attribute.Relation<'manyToOne', 'api::campaign.campaign'>;
    completed_at: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discord_user_id: Schema.Attribute.String & Schema.Attribute.Required;
    discord_username: Schema.Attribute.String & Schema.Attribute.Required;
    guild_id: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-completion.campaign-onboarding-completion'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCampaignOnboardingFieldCampaignOnboardingField
  extends Struct.CollectionTypeSchema {
  collectionName: 'campaign_onboarding_fields';
  info: {
    displayName: 'Campaign Onboarding Field';
    pluralName: 'campaign-onboarding-fields';
    singularName: 'campaign-onboarding-field';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaign: Schema.Attribute.Relation<'manyToOne', 'api::campaign.campaign'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discord_integration: Schema.Attribute.JSON;
    field_description: Schema.Attribute.String;
    field_key: Schema.Attribute.String & Schema.Attribute.Required;
    field_label: Schema.Attribute.String & Schema.Attribute.Required;
    field_options: Schema.Attribute.JSON;
    field_placeholder: Schema.Attribute.String;
    field_type: Schema.Attribute.Enumeration<
      ['text', 'email', 'number', 'boolean', 'url', 'select', 'multiselect']
    > &
      Schema.Attribute.Required;
    is_enabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    is_required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-field.campaign-onboarding-field'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sort_order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validation_rules: Schema.Attribute.JSON;
  };
}

export interface ApiCampaignOnboardingResponseCampaignOnboardingResponse
  extends Struct.CollectionTypeSchema {
  collectionName: 'campaign_onboarding_responses';
  info: {
    displayName: 'Campaign Onboarding Response';
    pluralName: 'campaign-onboarding-responses';
    singularName: 'campaign-onboarding-response';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaign: Schema.Attribute.Relation<'manyToOne', 'api::campaign.campaign'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discord_user_id: Schema.Attribute.String & Schema.Attribute.Required;
    discord_username: Schema.Attribute.String;
    field_key: Schema.Attribute.String & Schema.Attribute.Required;
    field_value: Schema.Attribute.String;
    interaction_id: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-response.campaign-onboarding-response'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    referral_id: Schema.Attribute.String;
    referral_link: Schema.Attribute.Relation<
      'manyToOne',
      'api::referral-link.referral-link'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCampaignOnboardingStartCampaignOnboardingStart
  extends Struct.CollectionTypeSchema {
  collectionName: 'campaign_onboarding_starts';
  info: {
    displayName: 'Campaign Onboarding Start';
    pluralName: 'campaign-onboarding-starts';
    singularName: 'campaign-onboarding-start';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaign: Schema.Attribute.Relation<'manyToOne', 'api::campaign.campaign'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discord_user_id: Schema.Attribute.String & Schema.Attribute.Required;
    discord_username: Schema.Attribute.String & Schema.Attribute.Required;
    guild_id: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-start.campaign-onboarding-start'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    started_at: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCampaignTemplateCampaignTemplate
  extends Struct.CollectionTypeSchema {
  collectionName: 'campaign_templates';
  info: {
    displayName: 'Campaign Template';
    pluralName: 'campaign-templates';
    singularName: 'campaign-template';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaign_type: Schema.Attribute.Enumeration<
      [
        'referral_onboarding',
        'community_engagement',
        'product_promotion',
        'custom',
        'vip_support',
      ]
    > &
      Schema.Attribute.Required;
    category: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.RichText;
    is_default: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    landing_page_template: Schema.Attribute.Relation<
      'oneToOne',
      'api::landing-page-template.landing-page-template'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-template.campaign-template'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    template_config: Schema.Attribute.JSON & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCampaignCampaign extends Struct.CollectionTypeSchema {
  collectionName: 'campaigns';
  info: {
    displayName: 'Campaign';
    pluralName: 'campaigns';
    singularName: 'campaign';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    auto_responses: Schema.Attribute.JSON;
    auto_role_assignment: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    bot_avatar_url: Schema.Attribute.String;
    bot_name: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Virion Bot'>;
    bot_personality: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'helpful'>;
    bot_response_style: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'friendly'>;
    brand_color: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'#6366f1'>;
    brand_logo_url: Schema.Attribute.String;
    campaign_influencer_accesses: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-influencer-access.campaign-influencer-access'
    >;
    campaign_landing_page: Schema.Attribute.Relation<
      'oneToOne',
      'api::campaign-landing-page.campaign-landing-page'
    >;
    campaign_onboarding_completions: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-completion.campaign-onboarding-completion'
    >;
    campaign_onboarding_fields: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-field.campaign-onboarding-field'
    >;
    campaign_onboarding_responses: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-response.campaign-onboarding-response'
    >;
    campaign_onboarding_starts: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-start.campaign-onboarding-start'
    >;
    campaign_type: Schema.Attribute.Enumeration<
      [
        'referral_onboarding',
        'community_engagement',
        'product_promotion',
        'custom',
        'vip_support',
      ]
    >;
    channel_id: Schema.Attribute.String;
    client: Schema.Attribute.Relation<'manyToOne', 'api::client.client'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    custom_commands: Schema.Attribute.JSON;
    description: Schema.Attribute.RichText;
    end_date: Schema.Attribute.DateTime;
    features: Schema.Attribute.JSON;
    guild_id: Schema.Attribute.String & Schema.Attribute.Required;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign.campaign'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    moderation_enabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    rate_limit_per_user: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<5>;
    referral_conversions: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    referral_links: Schema.Attribute.Relation<
      'oneToMany',
      'api::referral-link.referral-link'
    >;
    referral_tracking_enabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    start_date: Schema.Attribute.DateTime;
    successful_onboardings: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    target_role_ids: Schema.Attribute.JSON;
    total_interactions: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    total_investment: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    value_per_conversion: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    webhook_url: Schema.Attribute.String;
    welcome_message: Schema.Attribute.RichText;
  };
}

export interface ApiClientClient extends Struct.CollectionTypeSchema {
  collectionName: 'clients';
  info: {
    displayName: 'Client';
    pluralName: 'clients';
    singularName: 'client';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaigns: Schema.Attribute.Relation<'oneToMany', 'api::campaign.campaign'>;
    client_status: Schema.Attribute.Enumeration<['active', 'inactive']> &
      Schema.Attribute.DefaultTo<'active'>;
    contact_email: Schema.Attribute.Email;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    industry: Schema.Attribute.String & Schema.Attribute.Required;
    influencers: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    join_date: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::client.client'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    primary_contact: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String;
  };
}

export interface ApiLandingPageTemplateLandingPageTemplate
  extends Struct.CollectionTypeSchema {
  collectionName: 'landing_page_templates';
  info: {
    displayName: 'Landing Page Template';
    pluralName: 'landing-page-templates';
    singularName: 'landing-page-template';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    campaign_types: Schema.Attribute.JSON & Schema.Attribute.Required;
    category: Schema.Attribute.String;
    color_scheme: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customizable_fields: Schema.Attribute.JSON & Schema.Attribute.Required;
    default_content: Schema.Attribute.JSON & Schema.Attribute.Required;
    default_hero_image_url: Schema.Attribute.String;
    default_how_it_works: Schema.Attribute.String;
    default_offer_description: Schema.Attribute.String;
    default_offer_highlights: Schema.Attribute.JSON;
    default_offer_title: Schema.Attribute.String;
    default_offer_value: Schema.Attribute.String;
    default_requirements: Schema.Attribute.String;
    default_support_info: Schema.Attribute.String;
    default_video_url: Schema.Attribute.String;
    default_what_you_get: Schema.Attribute.String;
    Description: Schema.Attribute.String & Schema.Attribute.Required;
    is_active: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    is_default: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    layout_config: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::landing-page-template.landing-page-template'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    preview_image_url: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    template_structure: Schema.Attribute.JSON & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReferralAnalyticReferralAnalytic
  extends Struct.CollectionTypeSchema {
  collectionName: 'referral_analytics';
  info: {
    displayName: 'Referral Analytics';
    pluralName: 'referral-analytics';
    singularName: 'referral-analytic';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    browser: Schema.Attribute.String;
    city: Schema.Attribute.String;
    conversion_value: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    device_type: Schema.Attribute.String;
    event_type: Schema.Attribute.String & Schema.Attribute.Required;
    ip_address: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::referral-analytic.referral-analytic'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    referrer: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_agent: Schema.Attribute.String;
  };
}

export interface ApiReferralLinkReferralLink
  extends Struct.CollectionTypeSchema {
  collectionName: 'referral_links';
  info: {
    displayName: 'Referral Link';
    pluralName: 'referral-links';
    singularName: 'referral-link';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    access_role_id: Schema.Attribute.String;
    campaign: Schema.Attribute.Relation<'manyToOne', 'api::campaign.campaign'>;
    campaign_onboarding_responses: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-onboarding-response.campaign-onboarding-response'
    >;
    clicks: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    conversion_rate: Schema.Attribute.Decimal;
    conversions: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    custom_invite_code: Schema.Attribute.String;
    description: Schema.Attribute.RichText;
    discord_guild_id: Schema.Attribute.String;
    discord_invite_url: Schema.Attribute.String;
    earnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    expires_at: Schema.Attribute.DateTime;
    influencer: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    landing_page_enabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    last_conversion_at: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::referral-link.referral-link'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    original_url: Schema.Attribute.String & Schema.Attribute.Required;
    platform: Schema.Attribute.String & Schema.Attribute.Required;
    private_channel_id: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    redirect_to_discord: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    referral_analytics: Schema.Attribute.Relation<
      'oneToMany',
      'api::referral-analytic.referral-analytic'
    >;
    referral_code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    referral_url: Schema.Attribute.String & Schema.Attribute.Required;
    thumbnail_url: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUserSettingUserSetting extends Struct.CollectionTypeSchema {
  collectionName: 'user_settings';
  info: {
    displayName: 'User Setting';
    pluralName: 'user-settings';
    singularName: 'user-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    api_key: Schema.Attribute.String;
    api_key_regenerated_at: Schema.Attribute.DateTime;
    api_key_test: Schema.Attribute.String;
    bio: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'USD'>;
    discord_username: Schema.Attribute.String;
    email_notifications_link_clicks: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    email_notifications_new_referral: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    email_notifications_product_updates: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    email_notifications_weekly_reports: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    instagram_handle: Schema.Attribute.String;
    language: Schema.Attribute.String & Schema.Attribute.DefaultTo<'en'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-setting.user-setting'
    > &
      Schema.Attribute.Private;
    login_notifications: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    phone_number: Schema.Attribute.String;
    profile_visibility: Schema.Attribute.Enumeration<['public', 'private']>;
    publishedAt: Schema.Attribute.DateTime;
    push_notifications_link_clicks: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    push_notifications_new_referral: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    push_notifications_product_updates: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    push_notifications_weekly_reports: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    show_earnings: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    show_referral_count: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    theme: Schema.Attribute.Enumeration<['light', 'dark', 'system']> &
      Schema.Attribute.DefaultTo<'system'>;
    timezone: Schema.Attribute.String & Schema.Attribute.DefaultTo<'UTC'>;
    twitter_handle: Schema.Attribute.String;
    two_factor_enabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    webhook_events: Schema.Attribute.JSON;
    webhook_url: Schema.Attribute.String;
    website_url: Schema.Attribute.String;
    youtube_channel: Schema.Attribute.String;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avatar_url: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    campaign_influencer_accesses: Schema.Attribute.Relation<
      'oneToMany',
      'api::campaign-influencer-access.campaign-influencer-access'
    >;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    full_name: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    referral_links: Schema.Attribute.Relation<
      'oneToMany',
      'api::referral-link.referral-link'
    >;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_setting: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-setting.user-setting'
    >;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::campaign-influencer-access.campaign-influencer-access': ApiCampaignInfluencerAccessCampaignInfluencerAccess;
      'api::campaign-landing-page.campaign-landing-page': ApiCampaignLandingPageCampaignLandingPage;
      'api::campaign-onboarding-completion.campaign-onboarding-completion': ApiCampaignOnboardingCompletionCampaignOnboardingCompletion;
      'api::campaign-onboarding-field.campaign-onboarding-field': ApiCampaignOnboardingFieldCampaignOnboardingField;
      'api::campaign-onboarding-response.campaign-onboarding-response': ApiCampaignOnboardingResponseCampaignOnboardingResponse;
      'api::campaign-onboarding-start.campaign-onboarding-start': ApiCampaignOnboardingStartCampaignOnboardingStart;
      'api::campaign-template.campaign-template': ApiCampaignTemplateCampaignTemplate;
      'api::campaign.campaign': ApiCampaignCampaign;
      'api::client.client': ApiClientClient;
      'api::landing-page-template.landing-page-template': ApiLandingPageTemplateLandingPageTemplate;
      'api::referral-analytic.referral-analytic': ApiReferralAnalyticReferralAnalytic;
      'api::referral-link.referral-link': ApiReferralLinkReferralLink;
      'api::user-setting.user-setting': ApiUserSettingUserSetting;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
